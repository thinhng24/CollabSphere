using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using EventBus.Abstractions;
using EventBus.Events;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Polly;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RabbitMQ.Client.Exceptions;

namespace EventBus.RabbitMQ
{
    /// <summary>
    /// RabbitMQ implementation of IEventBus
    /// Provides publish/subscribe functionality for event-driven microservice communication
    /// </summary>
    public class RabbitMQEventBus : IEventBus, IDisposable
    {
        private readonly IConnection _connection;
        private readonly ILogger<RabbitMQEventBus> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IEventBusSubscriptionManager _subscriptionManager;
        private readonly string _exchangeName;
        private readonly string _queueName;
        private readonly int _retryCount;

        private IModel? _consumerChannel;
        private bool _disposed;

        public RabbitMQEventBus(
            IRabbitMQPersistentConnection persistentConnection,
            ILogger<RabbitMQEventBus> logger,
            IServiceProvider serviceProvider,
            IEventBusSubscriptionManager subscriptionManager,
            string exchangeName = "communication_event_bus",
            string queueName = "",
            int retryCount = 5)
        {
            _connection = persistentConnection?.Connection ?? throw new ArgumentNullException(nameof(persistentConnection));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _subscriptionManager = subscriptionManager ?? throw new ArgumentNullException(nameof(subscriptionManager));
            _exchangeName = exchangeName;
            _queueName = queueName;
            _retryCount = retryCount;

            _consumerChannel = CreateConsumerChannel();
            _subscriptionManager.OnEventRemoved += OnEventRemoved;
        }

        public bool IsConnected => _connection?.IsOpen ?? false;

        /// <summary>
        /// Publish an integration event asynchronously
        /// </summary>
        public async Task PublishAsync<TEvent>(TEvent @event) where TEvent : IntegrationEvent
        {
            await Task.Run(() => Publish(@event));
        }

        /// <summary>
        /// Publish an integration event to RabbitMQ
        /// </summary>
        public void Publish(IntegrationEvent @event)
        {
            if (!IsConnected)
            {
                _logger.LogWarning("RabbitMQ connection is not open. Cannot publish event.");
                return;
            }

            var policy = Policy.Handle<BrokerUnreachableException>()
                .Or<SocketException>()
                .WaitAndRetry(_retryCount, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)), (ex, time) =>
                {
                    _logger.LogWarning(ex, "Could not publish event: {EventId} after {Timeout}s", @event.Id, $"{time.TotalSeconds:n1}");
                });

            var eventName = @event.GetType().Name;

            _logger.LogTrace("Creating RabbitMQ channel to publish event: {EventId} ({EventName})", @event.Id, eventName);

            using var channel = _connection.CreateModel();

            _logger.LogTrace("Declaring RabbitMQ exchange to publish event: {EventId}", @event.Id);

            channel.ExchangeDeclare(exchange: _exchangeName, type: ExchangeType.Direct, durable: true);

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };

            var message = JsonSerializer.Serialize(@event, @event.GetType(), options);
            var body = Encoding.UTF8.GetBytes(message);

            policy.Execute(() =>
            {
                var properties = channel.CreateBasicProperties();
                properties.DeliveryMode = 2; // persistent
                properties.MessageId = @event.Id.ToString();
                properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
                properties.ContentType = "application/json";
                properties.ContentEncoding = "utf-8";

                if (!string.IsNullOrEmpty(@event.CorrelationId))
                {
                    properties.CorrelationId = @event.CorrelationId;
                }

                _logger.LogTrace("Publishing event to RabbitMQ: {EventId}", @event.Id);

                channel.BasicPublish(
                    exchange: _exchangeName,
                    routingKey: eventName,
                    mandatory: true,
                    basicProperties: properties,
                    body: body);

                _logger.LogInformation("Published event {EventName} with ID {EventId}", eventName, @event.Id);
            });
        }

        /// <summary>
        /// Subscribe to an integration event
        /// </summary>
        public void Subscribe<TEvent, THandler>()
            where TEvent : IntegrationEvent
            where THandler : IIntegrationEventHandler<TEvent>
        {
            var eventName = typeof(TEvent).Name;
            var handlerType = typeof(THandler);

            _logger.LogInformation("Subscribing to event {EventName} with {EventHandler}", eventName, handlerType.Name);

            DoInternalSubscription(eventName);
            _subscriptionManager.AddSubscription<TEvent, THandler>();
        }

        /// <summary>
        /// Subscribe to a dynamic integration event
        /// </summary>
        public void SubscribeDynamic<THandler>(string eventName)
            where THandler : IDynamicIntegrationEventHandler
        {
            _logger.LogInformation("Subscribing to dynamic event {EventName} with {EventHandler}", eventName, typeof(THandler).Name);

            DoInternalSubscription(eventName);
            _subscriptionManager.AddDynamicSubscription<THandler>(eventName);
        }

        /// <summary>
        /// Unsubscribe from an integration event
        /// </summary>
        public void Unsubscribe<TEvent, THandler>()
            where TEvent : IntegrationEvent
            where THandler : IIntegrationEventHandler<TEvent>
        {
            var eventName = typeof(TEvent).Name;

            _logger.LogInformation("Unsubscribing from event {EventName}", eventName);

            _subscriptionManager.RemoveSubscription<TEvent, THandler>();
        }

        /// <summary>
        /// Unsubscribe from a dynamic integration event
        /// </summary>
        public void UnsubscribeDynamic<THandler>(string eventName)
            where THandler : IDynamicIntegrationEventHandler
        {
            _logger.LogInformation("Unsubscribing from dynamic event {EventName}", eventName);

            _subscriptionManager.RemoveDynamicSubscription<THandler>(eventName);
        }

        /// <summary>
        /// Start consuming messages from RabbitMQ
        /// </summary>
        public void StartConsuming()
        {
            _logger.LogTrace("Starting RabbitMQ basic consume");

            if (_consumerChannel == null)
            {
                _logger.LogError("Consumer channel is null. Cannot start consuming.");
                return;
            }

            var consumer = new AsyncEventingBasicConsumer(_consumerChannel);

            consumer.Received += OnMessageReceived;

            _consumerChannel.BasicConsume(
                queue: _queueName,
                autoAck: false,
                consumer: consumer);

            _logger.LogInformation("Started consuming messages from queue: {QueueName}", _queueName);
        }

        /// <summary>
        /// Stop consuming messages
        /// </summary>
        public void StopConsuming()
        {
            _consumerChannel?.Close();
            _logger.LogInformation("Stopped consuming messages");
        }

        private void DoInternalSubscription(string eventName)
        {
            var containsKey = _subscriptionManager.HasSubscriptionsForEvent(eventName);
            if (containsKey) return;

            if (_consumerChannel == null)
            {
                _consumerChannel = CreateConsumerChannel();
            }

            _consumerChannel.QueueBind(
                queue: _queueName,
                exchange: _exchangeName,
                routingKey: eventName);

            _logger.LogTrace("Bound queue {QueueName} to exchange {ExchangeName} with routing key {RoutingKey}",
                _queueName, _exchangeName, eventName);
        }

        private void OnEventRemoved(object? sender, string eventName)
        {
            if (_consumerChannel == null) return;

            _consumerChannel.QueueUnbind(
                queue: _queueName,
                exchange: _exchangeName,
                routingKey: eventName);

            if (_subscriptionManager.IsEmpty)
            {
                _queueName.GetType(); // Keep reference
                _consumerChannel.Close();
            }
        }

        private IModel CreateConsumerChannel()
        {
            _logger.LogTrace("Creating RabbitMQ consumer channel");

            var channel = _connection.CreateModel();

            channel.ExchangeDeclare(
                exchange: _exchangeName,
                type: ExchangeType.Direct,
                durable: true);

            channel.QueueDeclare(
                queue: _queueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: new Dictionary<string, object>
                {
                    { "x-dead-letter-exchange", $"{_exchangeName}.dlx" },
                    { "x-message-ttl", 86400000 } // 24 hours
                });

            channel.CallbackException += (sender, ea) =>
            {
                _logger.LogWarning(ea.Exception, "Recreating RabbitMQ consumer channel");
                _consumerChannel?.Dispose();
                _consumerChannel = CreateConsumerChannel();
                StartConsuming();
            };

            return channel;
        }

        private async Task OnMessageReceived(object sender, BasicDeliverEventArgs eventArgs)
        {
            var eventName = eventArgs.RoutingKey;
            var message = Encoding.UTF8.GetString(eventArgs.Body.Span);

            try
            {
                _logger.LogTrace("Processing RabbitMQ event: {EventName}", eventName);

                if (_subscriptionManager.HasSubscriptionsForEvent(eventName))
                {
                    await ProcessEvent(eventName, message);
                }
                else
                {
                    _logger.LogWarning("No subscription found for event: {EventName}", eventName);
                }

                // Acknowledge the message
                _consumerChannel?.BasicAck(eventArgs.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message: {EventName}", eventName);

                // Negative acknowledgment - requeue the message
                _consumerChannel?.BasicNack(eventArgs.DeliveryTag, multiple: false, requeue: true);
            }
        }

        private async Task ProcessEvent(string eventName, string message)
        {
            _logger.LogTrace("Processing integration event: {EventName}", eventName);

            using var scope = _serviceProvider.CreateScope();
            var subscriptions = _subscriptionManager.GetHandlersForEvent(eventName);

            foreach (var subscription in subscriptions)
            {
                if (subscription.IsDynamic)
                {
                    if (scope.ServiceProvider.GetService(subscription.HandlerType) is not IDynamicIntegrationEventHandler handler)
                    {
                        _logger.LogWarning("No handler found for dynamic event: {EventName}", eventName);
                        continue;
                    }

                    using var doc = JsonDocument.Parse(message);
                    dynamic eventData = doc.RootElement;
                    await handler.HandleAsync(eventData);
                }
                else
                {
                    var handler = scope.ServiceProvider.GetService(subscription.HandlerType);
                    if (handler == null)
                    {
                        _logger.LogWarning("No handler found for event: {EventName}", eventName);
                        continue;
                    }

                    var eventType = _subscriptionManager.GetEventTypeByName(eventName);
                    if (eventType == null)
                    {
                        _logger.LogWarning("Event type not found: {EventName}", eventName);
                        continue;
                    }

                    var integrationEvent = JsonSerializer.Deserialize(message, eventType, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    });

                    if (integrationEvent == null)
                    {
                        _logger.LogWarning("Failed to deserialize event: {EventName}", eventName);
                        continue;
                    }

                    var concreteType = typeof(IIntegrationEventHandler<>).MakeGenericType(eventType);
                    var handleMethod = concreteType.GetMethod("HandleAsync");

                    if (handleMethod != null)
                    {
                        await (Task)handleMethod.Invoke(handler, new[] { integrationEvent })!;
                    }
                }
            }

            _logger.LogTrace("Processed integration event: {EventName}", eventName);
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (_disposed) return;

            if (disposing)
            {
                _consumerChannel?.Dispose();
                _subscriptionManager.Clear();
            }

            _disposed = true;
        }
    }

    /// <summary>
    /// Interface for managing RabbitMQ persistent connection
    /// </summary>
    public interface IRabbitMQPersistentConnection
    {
        bool IsConnected { get; }
        IConnection Connection { get; }
        bool TryConnect();
    }

    /// <summary>
    /// Interface for managing event bus subscriptions
    /// </summary>
    public interface IEventBusSubscriptionManager
    {
        event EventHandler<string> OnEventRemoved;
        bool IsEmpty { get; }
        void AddSubscription<TEvent, THandler>()
            where TEvent : IntegrationEvent
            where THandler : IIntegrationEventHandler<TEvent>;
        void AddDynamicSubscription<THandler>(string eventName)
            where THandler : IDynamicIntegrationEventHandler;
        void RemoveSubscription<TEvent, THandler>()
            where TEvent : IntegrationEvent
            where THandler : IIntegrationEventHandler<TEvent>;
        void RemoveDynamicSubscription<THandler>(string eventName)
            where THandler : IDynamicIntegrationEventHandler;
        bool HasSubscriptionsForEvent(string eventName);
        Type? GetEventTypeByName(string eventName);
        IEnumerable<SubscriptionInfo> GetHandlersForEvent(string eventName);
        void Clear();
    }

    /// <summary>
    /// Subscription information for event handlers
    /// </summary>
    public class SubscriptionInfo
    {
        public bool IsDynamic { get; }
        public Type HandlerType { get; }

        private SubscriptionInfo(bool isDynamic, Type handlerType)
        {
            IsDynamic = isDynamic;
            HandlerType = handlerType;
        }

        public static SubscriptionInfo Dynamic(Type handlerType) => new(true, handlerType);
        public static SubscriptionInfo Typed(Type handlerType) => new(false, handlerType);
    }
}

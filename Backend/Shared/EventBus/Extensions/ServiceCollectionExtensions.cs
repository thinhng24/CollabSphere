using EventBus.Abstractions;
using EventBus.Events;
using EventBus.RabbitMQ;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

namespace EventBus.Extensions;

/// <summary>
/// Extension methods for registering EventBus services in the DI container
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds RabbitMQ EventBus services to the service collection
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configuration">The configuration</param>
    /// <param name="sectionName">The configuration section name for RabbitMQ settings</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddRabbitMQEventBus(
        this IServiceCollection services,
        IConfiguration configuration,
        string sectionName = "RabbitMQ")
    {
        var settings = new RabbitMQSettings();
        configuration.GetSection(sectionName).Bind(settings);

        return services.AddRabbitMQEventBus(settings);
    }

    /// <summary>
    /// Adds RabbitMQ EventBus services with explicit settings
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="settings">The RabbitMQ settings</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddRabbitMQEventBus(
        this IServiceCollection services,
        RabbitMQSettings settings)
    {
        // Register settings
        services.AddSingleton(settings);

        // Register connection factory
        services.AddSingleton<IConnectionFactory>(sp =>
        {
            if (!string.IsNullOrEmpty(settings.ConnectionString))
            {
                return RabbitMQConnectionFactory.CreateConnectionFactory(settings.ConnectionString);
            }
            return RabbitMQConnectionFactory.CreateConnectionFactory(settings);
        });

        // Register persistent connection
        services.AddSingleton<IRabbitMQPersistentConnection>(sp =>
        {
            var logger = sp.GetRequiredService<ILogger<RabbitMQPersistentConnection>>();
            var connectionFactory = sp.GetRequiredService<IConnectionFactory>();

            return new RabbitMQPersistentConnection(connectionFactory, logger, settings.RetryCount);
        });

        // Register subscription manager
        services.AddSingleton<IEventBusSubscriptionManager, InMemoryEventBusSubscriptionManager>();

        // Register event bus
        services.AddSingleton<IEventBus>(sp =>
        {
            var persistentConnection = sp.GetRequiredService<IRabbitMQPersistentConnection>();
            var logger = sp.GetRequiredService<ILogger<RabbitMQEventBus>>();
            var subscriptionManager = sp.GetRequiredService<IEventBusSubscriptionManager>();

            // Ensure connection is established
            if (!persistentConnection.IsConnected)
            {
                persistentConnection.TryConnect();
            }

            var queueName = string.IsNullOrEmpty(settings.QueueName)
                ? $"communication_{Guid.NewGuid():N}"
                : settings.QueueName;

            return new RabbitMQEventBus(
                persistentConnection,
                logger,
                sp,
                subscriptionManager,
                settings.ExchangeName,
                queueName,
                settings.RetryCount);
        });

        return services;
    }

    /// <summary>
    /// Adds an in-memory event bus for testing or simple scenarios
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddInMemoryEventBus(this IServiceCollection services)
    {
        services.AddSingleton<IEventBusSubscriptionManager, InMemoryEventBusSubscriptionManager>();
        services.AddSingleton<IEventBus, InMemoryEventBus>();
        return services;
    }

    /// <summary>
    /// Registers an integration event handler
    /// </summary>
    /// <typeparam name="TEvent">The event type</typeparam>
    /// <typeparam name="THandler">The handler type</typeparam>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddEventHandler<TEvent, THandler>(this IServiceCollection services)
        where TEvent : IntegrationEvent
        where THandler : class, IIntegrationEventHandler<TEvent>
    {
        services.AddTransient<THandler>();
        return services;
    }
}

/// <summary>
/// In-memory event bus implementation for testing or simple scenarios
/// </summary>
public class InMemoryEventBus : IEventBus
{
    private readonly IEventBusSubscriptionManager _subscriptionManager;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<InMemoryEventBus> _logger;

    public InMemoryEventBus(
        IEventBusSubscriptionManager subscriptionManager,
        IServiceProvider serviceProvider,
        ILogger<InMemoryEventBus> logger)
    {
        _subscriptionManager = subscriptionManager ?? throw new ArgumentNullException(nameof(subscriptionManager));
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public bool IsConnected => true;

    public async Task PublishAsync<TEvent>(TEvent @event) where TEvent : IntegrationEvent
    {
        var eventName = @event.GetType().Name;
        _logger.LogInformation("Publishing event {EventName} with ID {EventId}", eventName, @event.Id);

        if (!_subscriptionManager.HasSubscriptionsForEvent(eventName))
        {
            _logger.LogWarning("No handlers registered for event {EventName}", eventName);
            return;
        }

        var handlers = _subscriptionManager.GetHandlersForEvent(eventName);

        using var scope = _serviceProvider.CreateScope();

        foreach (var handler in handlers)
        {
            var handlerInstance = scope.ServiceProvider.GetService(handler.HandlerType);
            if (handlerInstance == null)
            {
                _logger.LogWarning("Handler {HandlerType} not found for event {EventName}",
                    handler.HandlerType.Name, eventName);
                continue;
            }

            var concreteType = typeof(IIntegrationEventHandler<>).MakeGenericType(@event.GetType());
            var handleMethod = concreteType.GetMethod("HandleAsync");

            if (handleMethod != null)
            {
                await (Task)handleMethod.Invoke(handlerInstance, new object[] { @event })!;
            }
        }

        _logger.LogInformation("Event {EventName} processed successfully", eventName);
    }

    public void Publish(IntegrationEvent @event)
    {
        Task.Run(async () => await PublishAsync(@event)).Wait();
    }

    public void Subscribe<TEvent, THandler>()
        where TEvent : IntegrationEvent
        where THandler : IIntegrationEventHandler<TEvent>
    {
        var eventName = typeof(TEvent).Name;
        _logger.LogInformation("Subscribing to event {EventName} with handler {HandlerType}",
            eventName, typeof(THandler).Name);

        _subscriptionManager.AddSubscription<TEvent, THandler>();
    }

    public void SubscribeDynamic<THandler>(string eventName)
        where THandler : IDynamicIntegrationEventHandler
    {
        _logger.LogInformation("Subscribing dynamically to event {EventName}", eventName);
        _subscriptionManager.AddDynamicSubscription<THandler>(eventName);
    }

    public void Unsubscribe<TEvent, THandler>()
        where TEvent : IntegrationEvent
        where THandler : IIntegrationEventHandler<TEvent>
    {
        _logger.LogInformation("Unsubscribing from event {EventName}", typeof(TEvent).Name);
        _subscriptionManager.RemoveSubscription<TEvent, THandler>();
    }

    public void UnsubscribeDynamic<THandler>(string eventName)
        where THandler : IDynamicIntegrationEventHandler
    {
        _logger.LogInformation("Unsubscribing dynamically from event {EventName}", eventName);
        _subscriptionManager.RemoveDynamicSubscription<THandler>(eventName);
    }

    public void StartConsuming()
    {
        _logger.LogInformation("InMemoryEventBus: StartConsuming called (no-op for in-memory bus)");
    }

    public void StopConsuming()
    {
        _logger.LogInformation("InMemoryEventBus: StopConsuming called (no-op for in-memory bus)");
    }

    public void Dispose()
    {
        _subscriptionManager.Clear();
    }
}

/// <summary>
/// Interface extensions for IServiceCollection to configure event subscriptions at startup
/// </summary>
public static class EventBusExtensions
{
    /// <summary>
    /// Configures event bus subscriptions using the provided action
    /// Call this after AddRabbitMQEventBus or AddInMemoryEventBus
    /// </summary>
    public static IServiceCollection ConfigureEventBus(
        this IServiceCollection services,
        Action<IEventBusConfigurator> configure)
    {
        services.AddSingleton<IEventBusConfigurator>(sp =>
        {
            var eventBus = sp.GetRequiredService<IEventBus>();
            return new EventBusConfigurator(eventBus);
        });

        // Register a hosted service to configure subscriptions at startup
        services.AddHostedService<EventBusStartupService>();

        // Store the configuration action
        EventBusStartupService.ConfigurationAction = configure;

        return services;
    }
}

/// <summary>
/// Interface for configuring event bus subscriptions
/// </summary>
public interface IEventBusConfigurator
{
    void Subscribe<TEvent, THandler>()
        where TEvent : IntegrationEvent
        where THandler : IIntegrationEventHandler<TEvent>;
}

/// <summary>
/// Implementation of IEventBusConfigurator
/// </summary>
public class EventBusConfigurator : IEventBusConfigurator
{
    private readonly IEventBus _eventBus;

    public EventBusConfigurator(IEventBus eventBus)
    {
        _eventBus = eventBus;
    }

    public void Subscribe<TEvent, THandler>()
        where TEvent : IntegrationEvent
        where THandler : IIntegrationEventHandler<TEvent>
    {
        _eventBus.Subscribe<TEvent, THandler>();
    }
}

/// <summary>
/// Hosted service that starts event bus consuming and configures subscriptions
/// </summary>
public class EventBusStartupService : Microsoft.Extensions.Hosting.IHostedService
{
    private readonly IEventBus _eventBus;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EventBusStartupService> _logger;

    public static Action<IEventBusConfigurator>? ConfigurationAction { get; set; }

    public EventBusStartupService(
        IEventBus eventBus,
        IServiceProvider serviceProvider,
        ILogger<EventBusStartupService> logger)
    {
        _eventBus = eventBus;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("EventBus startup service starting...");

        try
        {
            // Configure subscriptions
            if (ConfigurationAction != null)
            {
                var configurator = new EventBusConfigurator(_eventBus);
                ConfigurationAction(configurator);
            }

            // Start consuming
            _eventBus.StartConsuming();

            _logger.LogInformation("EventBus startup completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting EventBus");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("EventBus startup service stopping...");

        try
        {
            _eventBus.StopConsuming();
            _eventBus.Dispose();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping EventBus");
        }

        return Task.CompletedTask;
    }
}

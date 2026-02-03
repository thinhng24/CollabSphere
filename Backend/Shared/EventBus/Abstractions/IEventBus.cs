using EventBus.Events;

namespace EventBus.Abstractions
{
    /// <summary>
    /// Interface for Event Bus - provides publish/subscribe functionality
    /// for event-driven communication between microservices
    /// </summary>
    public interface IEventBus
    {
        /// <summary>
        /// Publish an integration event to the event bus
        /// </summary>
        /// <param name="event">The integration event to publish</param>
        /// <typeparam name="TEvent">Type of the event</typeparam>
        Task PublishAsync<TEvent>(TEvent @event) where TEvent : IntegrationEvent;

        /// <summary>
        /// Publish an integration event to the event bus (synchronous)
        /// </summary>
        /// <param name="event">The integration event to publish</param>
        void Publish(IntegrationEvent @event);

        /// <summary>
        /// Subscribe to an integration event
        /// </summary>
        /// <typeparam name="TEvent">Type of the event to subscribe to</typeparam>
        /// <typeparam name="THandler">Type of the event handler</typeparam>
        void Subscribe<TEvent, THandler>()
            where TEvent : IntegrationEvent
            where THandler : IIntegrationEventHandler<TEvent>;

        /// <summary>
        /// Subscribe to an integration event dynamically
        /// </summary>
        /// <typeparam name="THandler">Type of the dynamic event handler</typeparam>
        /// <param name="eventName">Name of the event to subscribe to</param>
        void SubscribeDynamic<THandler>(string eventName)
            where THandler : IDynamicIntegrationEventHandler;

        /// <summary>
        /// Unsubscribe from an integration event
        /// </summary>
        /// <typeparam name="TEvent">Type of the event to unsubscribe from</typeparam>
        /// <typeparam name="THandler">Type of the event handler</typeparam>
        void Unsubscribe<TEvent, THandler>()
            where TEvent : IntegrationEvent
            where THandler : IIntegrationEventHandler<TEvent>;

        /// <summary>
        /// Unsubscribe from a dynamic integration event
        /// </summary>
        /// <typeparam name="THandler">Type of the dynamic event handler</typeparam>
        /// <param name="eventName">Name of the event to unsubscribe from</param>
        void UnsubscribeDynamic<THandler>(string eventName)
            where THandler : IDynamicIntegrationEventHandler;

        /// <summary>
        /// Start consuming messages from the event bus
        /// </summary>
        void StartConsuming();

        /// <summary>
        /// Stop consuming messages from the event bus
        /// </summary>
        void StopConsuming();

        /// <summary>
        /// Check if the event bus is connected
        /// </summary>
        bool IsConnected { get; }

        /// <summary>
        /// Dispose resources
        /// </summary>
        void Dispose();
    }
}

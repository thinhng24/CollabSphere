using EventBus.Events;

namespace EventBus.Abstractions
{
    /// <summary>
    /// Base interface for integration event handlers
    /// </summary>
    public interface IIntegrationEventHandler
    {
    }

    /// <summary>
    /// Generic interface for handling integration events
    /// Implements the mediator pattern for event-driven communication between microservices
    /// </summary>
    /// <typeparam name="TIntegrationEvent">The type of integration event to handle</typeparam>
    public interface IIntegrationEventHandler<in TIntegrationEvent> : IIntegrationEventHandler
        where TIntegrationEvent : IntegrationEvent
    {
        /// <summary>
        /// Handles the integration event asynchronously
        /// </summary>
        /// <param name="event">The integration event to handle</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task HandleAsync(TIntegrationEvent @event);
    }

    /// <summary>
    /// Dynamic integration event handler for handling events by name
    /// Used when the event type is not known at compile time
    /// </summary>
    public interface IDynamicIntegrationEventHandler
    {
        /// <summary>
        /// Handles the dynamic integration event asynchronously
        /// </summary>
        /// <param name="eventData">The event data as a dynamic object</param>
        /// <returns>A task representing the asynchronous operation</returns>
        Task HandleAsync(dynamic eventData);
    }
}

using EventBus.Events;

namespace EventBus.Interfaces;

public interface IEventBus
{
    Task PublishAsync<T>(T @event) where T : IntegrationEvent;
    void Subscribe<T, TH>()
        where T : IntegrationEvent
        where TH : IIntegrationEventHandler<T>;
}

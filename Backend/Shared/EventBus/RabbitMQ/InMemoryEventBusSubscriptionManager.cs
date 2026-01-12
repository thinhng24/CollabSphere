using EventBus.Abstractions;
using EventBus.Events;

namespace EventBus.RabbitMQ;

/// <summary>
/// In-memory implementation of IEventBusSubscriptionManager
/// Manages event subscriptions and handlers for the event bus
/// </summary>
public class InMemoryEventBusSubscriptionManager : IEventBusSubscriptionManager
{
    private readonly Dictionary<string, List<SubscriptionInfo>> _handlers;
    private readonly List<Type> _eventTypes;
    private readonly object _syncRoot = new();

    public event EventHandler<string>? OnEventRemoved;

    public InMemoryEventBusSubscriptionManager()
    {
        _handlers = new Dictionary<string, List<SubscriptionInfo>>();
        _eventTypes = new List<Type>();
    }

    /// <summary>
    /// Gets whether there are no subscriptions
    /// </summary>
    public bool IsEmpty
    {
        get
        {
            lock (_syncRoot)
            {
                return _handlers.Count == 0;
            }
        }
    }

    /// <summary>
    /// Clears all subscriptions
    /// </summary>
    public void Clear()
    {
        lock (_syncRoot)
        {
            _handlers.Clear();
            _eventTypes.Clear();
        }
    }

    /// <summary>
    /// Adds a typed subscription
    /// </summary>
    public void AddSubscription<TEvent, THandler>()
        where TEvent : IntegrationEvent
        where THandler : IIntegrationEventHandler<TEvent>
    {
        var eventName = GetEventKey<TEvent>();

        DoAddSubscription(typeof(THandler), eventName, isDynamic: false);

        lock (_syncRoot)
        {
            if (!_eventTypes.Contains(typeof(TEvent)))
            {
                _eventTypes.Add(typeof(TEvent));
            }
        }
    }

    /// <summary>
    /// Adds a dynamic subscription
    /// </summary>
    public void AddDynamicSubscription<THandler>(string eventName)
        where THandler : IDynamicIntegrationEventHandler
    {
        DoAddSubscription(typeof(THandler), eventName, isDynamic: true);
    }

    /// <summary>
    /// Removes a typed subscription
    /// </summary>
    public void RemoveSubscription<TEvent, THandler>()
        where TEvent : IntegrationEvent
        where THandler : IIntegrationEventHandler<TEvent>
    {
        var handlerToRemove = FindSubscriptionToRemove<TEvent, THandler>();
        var eventName = GetEventKey<TEvent>();
        DoRemoveHandler(eventName, handlerToRemove);
    }

    /// <summary>
    /// Removes a dynamic subscription
    /// </summary>
    public void RemoveDynamicSubscription<THandler>(string eventName)
        where THandler : IDynamicIntegrationEventHandler
    {
        var handlerToRemove = FindDynamicSubscriptionToRemove<THandler>(eventName);
        DoRemoveHandler(eventName, handlerToRemove);
    }

    /// <summary>
    /// Checks if there are subscriptions for an event
    /// </summary>
    public bool HasSubscriptionsForEvent<TEvent>() where TEvent : IntegrationEvent
    {
        var key = GetEventKey<TEvent>();
        return HasSubscriptionsForEvent(key);
    }

    /// <summary>
    /// Checks if there are subscriptions for an event by name
    /// </summary>
    public bool HasSubscriptionsForEvent(string eventName)
    {
        lock (_syncRoot)
        {
            return _handlers.ContainsKey(eventName);
        }
    }

    /// <summary>
    /// Gets the event type by name
    /// </summary>
    public Type? GetEventTypeByName(string eventName)
    {
        lock (_syncRoot)
        {
            return _eventTypes.SingleOrDefault(t => t.Name == eventName);
        }
    }

    /// <summary>
    /// Gets handlers for an event type
    /// </summary>
    public IEnumerable<SubscriptionInfo> GetHandlersForEvent<TEvent>() where TEvent : IntegrationEvent
    {
        var key = GetEventKey<TEvent>();
        return GetHandlersForEvent(key);
    }

    /// <summary>
    /// Gets handlers for an event by name
    /// </summary>
    public IEnumerable<SubscriptionInfo> GetHandlersForEvent(string eventName)
    {
        lock (_syncRoot)
        {
            if (_handlers.TryGetValue(eventName, out var handlers))
            {
                return handlers.ToList();
            }
            return Enumerable.Empty<SubscriptionInfo>();
        }
    }

    /// <summary>
    /// Gets the event key for a type
    /// </summary>
    public string GetEventKey<TEvent>()
    {
        return typeof(TEvent).Name;
    }

    /// <summary>
    /// Internal method to add subscription
    /// </summary>
    private void DoAddSubscription(Type handlerType, string eventName, bool isDynamic)
    {
        lock (_syncRoot)
        {
            if (!HasSubscriptionsForEvent(eventName))
            {
                _handlers.Add(eventName, new List<SubscriptionInfo>());
            }

            // Check if handler is already registered
            if (_handlers[eventName].Any(s => s.HandlerType == handlerType))
            {
                throw new ArgumentException(
                    $"Handler Type {handlerType.Name} already registered for '{eventName}'", nameof(handlerType));
            }

            var subscriptionInfo = isDynamic
                ? SubscriptionInfo.Dynamic(handlerType)
                : SubscriptionInfo.Typed(handlerType);

            _handlers[eventName].Add(subscriptionInfo);
        }
    }

    /// <summary>
    /// Internal method to remove handler
    /// </summary>
    private void DoRemoveHandler(string eventName, SubscriptionInfo? subsToRemove)
    {
        if (subsToRemove == null) return;

        lock (_syncRoot)
        {
            if (!_handlers.TryGetValue(eventName, out var handlers)) return;

            handlers.Remove(subsToRemove);

            if (handlers.Count == 0)
            {
                _handlers.Remove(eventName);

                var eventType = _eventTypes.SingleOrDefault(e => e.Name == eventName);
                if (eventType != null)
                {
                    _eventTypes.Remove(eventType);
                }

                RaiseOnEventRemoved(eventName);
            }
        }
    }

    /// <summary>
    /// Raises the OnEventRemoved event
    /// </summary>
    private void RaiseOnEventRemoved(string eventName)
    {
        OnEventRemoved?.Invoke(this, eventName);
    }

    /// <summary>
    /// Finds a typed subscription to remove
    /// </summary>
    private SubscriptionInfo? FindSubscriptionToRemove<TEvent, THandler>()
        where TEvent : IntegrationEvent
        where THandler : IIntegrationEventHandler<TEvent>
    {
        var eventName = GetEventKey<TEvent>();
        return DoFindSubscriptionToRemove(eventName, typeof(THandler));
    }

    /// <summary>
    /// Finds a dynamic subscription to remove
    /// </summary>
    private SubscriptionInfo? FindDynamicSubscriptionToRemove<THandler>(string eventName)
        where THandler : IDynamicIntegrationEventHandler
    {
        return DoFindSubscriptionToRemove(eventName, typeof(THandler));
    }

    /// <summary>
    /// Internal method to find subscription to remove
    /// </summary>
    private SubscriptionInfo? DoFindSubscriptionToRemove(string eventName, Type handlerType)
    {
        lock (_syncRoot)
        {
            if (!HasSubscriptionsForEvent(eventName))
            {
                return null;
            }

            return _handlers[eventName].SingleOrDefault(s => s.HandlerType == handlerType);
        }
    }
}

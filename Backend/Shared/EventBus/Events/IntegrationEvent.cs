using System.Text.Json.Serialization;

namespace EventBus.Events
{
    /// <summary>
    /// Base class for all integration events used in microservice communication.
    /// Integration events are used to synchronize domain state across multiple microservices.
    /// </summary>
    public class IntegrationEvent
    {
        /// <summary>
        /// Unique identifier for this event instance
        /// </summary>
        [JsonPropertyName("id")]
        public Guid Id { get; private set; }

        /// <summary>
        /// Timestamp when the event was created (UTC)
        /// </summary>
        [JsonPropertyName("creationDate")]
        public DateTime CreationDate { get; private set; }

        /// <summary>
        /// Correlation ID for tracing related events across services
        /// </summary>
        [JsonPropertyName("correlationId")]
        public string? CorrelationId { get; set; }

        /// <summary>
        /// Name of the event type for routing purposes
        /// </summary>
        [JsonPropertyName("eventType")]
        public string EventType => GetType().Name;

        /// <summary>
        /// Version of the event schema for handling backward compatibility
        /// </summary>
        [JsonPropertyName("version")]
        public int Version { get; set; } = 1;

        /// <summary>
        /// Source service that published this event
        /// </summary>
        [JsonPropertyName("source")]
        public string? Source { get; set; }

        /// <summary>
        /// Default constructor - generates new Id and sets creation date to now
        /// </summary>
        public IntegrationEvent()
        {
            Id = Guid.NewGuid();
            CreationDate = DateTime.UtcNow;
        }

        /// <summary>
        /// Constructor with explicit Id and creation date (used for deserialization)
        /// </summary>
        /// <param name="id">Event ID</param>
        /// <param name="creationDate">Event creation date</param>
        [JsonConstructor]
        public IntegrationEvent(Guid id, DateTime creationDate)
        {
            Id = id;
            CreationDate = creationDate;
        }

        /// <summary>
        /// Constructor with correlation ID for event tracing
        /// </summary>
        /// <param name="correlationId">Correlation ID for tracing</param>
        public IntegrationEvent(string correlationId) : this()
        {
            CorrelationId = correlationId;
        }

        /// <summary>
        /// Creates a copy of this event with a new ID
        /// </summary>
        public IntegrationEvent WithNewId()
        {
            var clone = (IntegrationEvent)MemberwiseClone();
            clone.Id = Guid.NewGuid();
            clone.CreationDate = DateTime.UtcNow;
            return clone;
        }

        /// <summary>
        /// Gets the routing key for this event (used by message brokers)
        /// </summary>
        public virtual string GetRoutingKey()
        {
            return EventType.ToLowerInvariant();
        }

        public override string ToString()
        {
            return $"{EventType} [Id={Id}, Created={CreationDate:O}, CorrelationId={CorrelationId}]";
        }
    }

    /// <summary>
    /// Generic integration event with typed payload
    /// </summary>
    /// <typeparam name="TPayload">Type of the event payload</typeparam>
    public class IntegrationEvent<TPayload> : IntegrationEvent where TPayload : class
    {
        /// <summary>
        /// The event payload containing the actual data
        /// </summary>
        [JsonPropertyName("payload")]
        public TPayload? Payload { get; set; }

        public IntegrationEvent() : base()
        {
        }

        public IntegrationEvent(TPayload payload) : base()
        {
            Payload = payload;
        }

        public IntegrationEvent(TPayload payload, string correlationId) : base(correlationId)
        {
            Payload = payload;
        }

        public IntegrationEvent(Guid id, DateTime creationDate, TPayload payload) : base(id, creationDate)
        {
            Payload = payload;
        }
    }
}

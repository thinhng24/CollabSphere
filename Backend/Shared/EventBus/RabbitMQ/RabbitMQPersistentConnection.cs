using System.Net.Sockets;
using Microsoft.Extensions.Logging;
using Polly;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RabbitMQ.Client.Exceptions;

namespace EventBus.RabbitMQ;

/// <summary>
/// Manages a persistent connection to RabbitMQ with automatic reconnection
/// Implements the circuit breaker pattern for resilient connections
/// </summary>
public class RabbitMQPersistentConnection : IRabbitMQPersistentConnection, IDisposable
{
    private readonly IConnectionFactory _connectionFactory;
    private readonly ILogger<RabbitMQPersistentConnection> _logger;
    private readonly int _retryCount;
    private readonly object _syncRoot = new();

    private IConnection? _connection;
    private bool _disposed;

    public RabbitMQPersistentConnection(
        IConnectionFactory connectionFactory,
        ILogger<RabbitMQPersistentConnection> logger,
        int retryCount = 5)
    {
        _connectionFactory = connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _retryCount = retryCount;
    }

    /// <summary>
    /// Gets whether the connection is currently open
    /// </summary>
    public bool IsConnected => _connection is { IsOpen: true } && !_disposed;

    /// <summary>
    /// Gets the current RabbitMQ connection
    /// </summary>
    public IConnection Connection
    {
        get
        {
            if (!IsConnected)
            {
                throw new InvalidOperationException("No RabbitMQ connection is available. Call TryConnect() first.");
            }

            return _connection!;
        }
    }

    /// <summary>
    /// Attempts to establish a connection to RabbitMQ
    /// Uses Polly for retry logic with exponential backoff
    /// </summary>
    /// <returns>True if connection was established successfully</returns>
    public bool TryConnect()
    {
        _logger.LogInformation("RabbitMQ Client is trying to connect...");

        lock (_syncRoot)
        {
            if (IsConnected)
            {
                return true;
            }

            var policy = Policy
                .Handle<SocketException>()
                .Or<BrokerUnreachableException>()
                .WaitAndRetry(
                    _retryCount,
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    (ex, time) =>
                    {
                        _logger.LogWarning(ex,
                            "RabbitMQ Client could not connect after {TimeOut}s ({ExceptionMessage})",
                            $"{time.TotalSeconds:n1}",
                            ex.Message);
                    });

            try
            {
                policy.Execute(() =>
                {
                    _connection = _connectionFactory.CreateConnection();
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FATAL ERROR: RabbitMQ connection could not be created after {RetryCount} retries",
                    _retryCount);
                return false;
            }

            if (IsConnected && _connection != null)
            {
                _connection.ConnectionShutdown += OnConnectionShutdown;
                _connection.CallbackException += OnCallbackException;
                _connection.ConnectionBlocked += OnConnectionBlocked;
                _connection.ConnectionUnblocked += OnConnectionUnblocked;

                _logger.LogInformation(
                    "RabbitMQ Client acquired a persistent connection to '{HostName}' and is subscribed to failure events",
                    _connection.Endpoint.HostName);

                return true;
            }

            _logger.LogCritical("FATAL ERROR: RabbitMQ connection could not be created and opened");
            return false;
        }
    }

    /// <summary>
    /// Creates a new channel/model from the connection
    /// </summary>
    /// <returns>A new RabbitMQ channel</returns>
    public IModel CreateModel()
    {
        if (!IsConnected)
        {
            throw new InvalidOperationException("No RabbitMQ connections are available to create a model.");
        }

        return _connection!.CreateModel();
    }

    /// <summary>
    /// Handles connection shutdown events
    /// </summary>
    private void OnConnectionShutdown(object? sender, ShutdownEventArgs args)
    {
        if (_disposed) return;

        _logger.LogWarning("RabbitMQ connection shutdown. Reason: {Reason}. Trying to reconnect...", args.ReplyText);
        TryConnect();
    }

    /// <summary>
    /// Handles callback exceptions
    /// </summary>
    private void OnCallbackException(object? sender, CallbackExceptionEventArgs args)
    {
        if (_disposed) return;

        _logger.LogWarning(args.Exception, "RabbitMQ connection callback exception. Trying to reconnect...");
        TryConnect();
    }

    /// <summary>
    /// Handles connection blocked events (e.g., when RabbitMQ is low on resources)
    /// </summary>
    private void OnConnectionBlocked(object? sender, ConnectionBlockedEventArgs args)
    {
        if (_disposed) return;

        _logger.LogWarning("RabbitMQ connection is blocked. Reason: {Reason}", args.Reason);
    }

    /// <summary>
    /// Handles connection unblocked events
    /// </summary>
    private void OnConnectionUnblocked(object? sender, EventArgs args)
    {
        if (_disposed) return;

        _logger.LogInformation("RabbitMQ connection is unblocked");
    }

    /// <summary>
    /// Disposes the connection and releases resources
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Protected dispose method
    /// </summary>
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;

        if (disposing)
        {
            try
            {
                if (_connection != null)
                {
                    _connection.ConnectionShutdown -= OnConnectionShutdown;
                    _connection.CallbackException -= OnCallbackException;
                    _connection.ConnectionBlocked -= OnConnectionBlocked;
                    _connection.ConnectionUnblocked -= OnConnectionUnblocked;
                    _connection.Dispose();
                }
            }
            catch (IOException ex)
            {
                _logger.LogCritical(ex, "Error disposing RabbitMQ connection");
            }
        }

        _disposed = true;
    }

    ~RabbitMQPersistentConnection()
    {
        Dispose(false);
    }
}

/// <summary>
/// Factory for creating RabbitMQ persistent connections
/// </summary>
public static class RabbitMQConnectionFactory
{
    /// <summary>
    /// Creates a connection factory with the specified settings
    /// </summary>
    public static IConnectionFactory CreateConnectionFactory(RabbitMQSettings settings)
    {
        var factory = new ConnectionFactory
        {
            HostName = settings.HostName,
            Port = settings.Port,
            UserName = settings.UserName,
            Password = settings.Password,
            VirtualHost = settings.VirtualHost,
            DispatchConsumersAsync = true,
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
            RequestedHeartbeat = TimeSpan.FromSeconds(60)
        };

        if (settings.UseSsl)
        {
            factory.Ssl = new SslOption
            {
                Enabled = true,
                ServerName = settings.HostName
            };
        }

        return factory;
    }

    /// <summary>
    /// Creates a connection factory from a connection string
    /// </summary>
    public static IConnectionFactory CreateConnectionFactory(string connectionString)
    {
        var factory = new ConnectionFactory
        {
            Uri = new Uri(connectionString),
            DispatchConsumersAsync = true,
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
            RequestedHeartbeat = TimeSpan.FromSeconds(60)
        };

        return factory;
    }
}

/// <summary>
/// Settings for RabbitMQ connection
/// </summary>
public class RabbitMQSettings
{
    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public bool UseSsl { get; set; } = false;
    public string? ConnectionString { get; set; }
    public int RetryCount { get; set; } = 5;
    public string ExchangeName { get; set; } = "communication_event_bus";
    public string QueueName { get; set; } = "";
}

using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Services;

/// <summary>
/// 消息批量存储服务
/// </summary>
public class MessageBatchStorageService : IHostedService, IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MessageBatchStorageService> _logger;
    private Timer? _batchTimer;
    private readonly List<Message> _messageBuffer = new();
    private readonly object _bufferLock = new();
    private const int BATCH_SIZE = 100; // 每批处理100条消息
    private const int BATCH_INTERVAL_MS = 5000; // 5秒处理一次

    public MessageBatchStorageService(
        IServiceProvider serviceProvider,
        ILogger<MessageBatchStorageService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Message batch storage service starting...");
        
        // 启动定时器处理批量存储
        _batchTimer = new Timer(ProcessBatch, null, TimeSpan.Zero, TimeSpan.FromMilliseconds(BATCH_INTERVAL_MS));
        
        // 开始消费消息队列（通过作用域获取服务）
        using var scope = _serviceProvider.CreateScope();
        var messageQueueService = scope.ServiceProvider.GetRequiredService<IMessageQueueService>();
        await messageQueueService.StartConsumingAsync();
        
        _logger.LogInformation("Message batch storage service started");
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Message batch storage service stopping...");
        
        _batchTimer?.Dispose();
        
        // 停止消费消息队列（通过作用域获取服务）
        using var scope = _serviceProvider.CreateScope();
        var messageQueueService = scope.ServiceProvider.GetRequiredService<IMessageQueueService>();
        await messageQueueService.StopConsumingAsync();
        
        // 处理剩余的消息
        await ProcessRemainingMessagesAsync();
        
        _logger.LogInformation("Message batch storage service stopped");
    }

    /// <summary>
    /// 接收到消息队列中的消息
    /// </summary>
    private async Task OnMessageReceived(Message message)
    {
        lock (_bufferLock)
        {
            _messageBuffer.Add(message);
            _logger.LogDebug("接收到消息 {MessageId}，当前缓冲区大小: {BufferSize}", message.TraceId, _messageBuffer.Count);
        }

        // 如果缓冲区达到批量大小，立即处理
        if (_messageBuffer.Count >= BATCH_SIZE)
        {
            await ProcessBatchAsync();
        }
    }

    /// <summary>
    /// 定时器回调处理批量存储
    /// </summary>
    private async void ProcessBatch(object? state)
    {
        await ProcessBatchAsync();
    }

    /// <summary>
    /// 处理批量存储
    /// </summary>
    private async Task ProcessBatchAsync()
    {
        if (_messageBuffer.Count == 0)
            return;

        List<Message> messagesToProcess;
        lock (_bufferLock)
        {
            messagesToProcess = new List<Message>(_messageBuffer);
            _messageBuffer.Clear();
        }

        if (messagesToProcess.Count == 0)
            return;

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<UserRelatedContext>();

            // 批量插入消息
            await context.Messages.AddRangeAsync(messagesToProcess);
            await context.SaveChangesAsync();

            // 缓存消息到内存
            var messageCacheService = scope.ServiceProvider.GetRequiredService<MessageCacheService>();
            messageCacheService.CacheMessages(messagesToProcess);

            _logger.LogInformation("Batch stored {Count} messages to DB and cache", messagesToProcess.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Batch storage failed, re-queuing messages");
            
            // 重新加入队列等待下次处理
            lock (_bufferLock)
            {
                _messageBuffer.AddRange(messagesToProcess);
            }
        }
    }

    /// <summary>
    /// 处理剩余的消息
    /// </summary>
    private async Task ProcessRemainingMessagesAsync()
    {
        List<Message> remainingMessages;
        lock (_bufferLock)
        {
            remainingMessages = new List<Message>(_messageBuffer);
            _messageBuffer.Clear();
        }

        if (remainingMessages.Count > 0)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<UserRelatedContext>();

                await context.Messages.AddRangeAsync(remainingMessages);
                await context.SaveChangesAsync();

                _logger.LogInformation("Stored remaining {Count} messages to DB", remainingMessages.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to store remaining messages");
            }
        }
    }

    public void Dispose()
    {
        _batchTimer?.Dispose();
    }
}
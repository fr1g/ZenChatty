using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Services;

/// <summary>
/// 空操作消息队列服务 - 不使用 RabbitMQ 时的替代实现
/// 消息直接通过 ChatHub 发送，不需要队列
/// </summary>
public class NoOpMessageQueueService : IMessageQueueService
{
    private readonly ILogger<NoOpMessageQueueService> _logger;

    public NoOpMessageQueueService(ILogger<NoOpMessageQueueService> logger)
    {
        _logger = logger;
        _logger.LogInformation("NoOpMessageQueueService 已初始化（不使用 RabbitMQ）");
    }

    /// <summary>
    /// 发送消息到队列（空操作）
    /// </summary>
    public Task SendMessageAsync(Message message)
    {
        _logger.LogDebug("NoOp: 跳过消息队列，消息ID: {MessageId}", message.TraceId);
        return Task.CompletedTask;
    }

    /// <summary>
    /// 批量发送消息到队列（空操作）
    /// </summary>
    public Task SendMessagesAsync(IEnumerable<Message> messages)
    {
        _logger.LogDebug("NoOp: 跳过批量消息队列");
        return Task.CompletedTask;
    }

    /// <summary>
    /// 开始消费消息队列（空操作）
    /// </summary>
    public Task StartConsumingAsync()
    {
        _logger.LogInformation("NoOp: 消息队列消费服务未启用（不使用 RabbitMQ）");
        return Task.CompletedTask;
    }

    /// <summary>
    /// 停止消费消息队列（空操作）
    /// </summary>
    public Task StopConsumingAsync()
    {
        _logger.LogInformation("NoOp: 消息队列消费服务已停止");
        return Task.CompletedTask;
    }
}


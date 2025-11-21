using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Services;

/// <summary>
/// 消息队列服务接口
/// </summary>
public interface IMessageQueueService
{
    /// <summary>
    /// 发送消息到队列
    /// </summary>
    Task SendMessageAsync(Message message);
    
    /// <summary>
    /// 批量发送消息到队列
    /// </summary>
    Task SendMessagesAsync(IEnumerable<Message> messages);
    
    /// <summary>
    /// 开始消费消息队列
    /// </summary>
    Task StartConsumingAsync();
    
    /// <summary>
    /// 停止消费消息队列
    /// </summary>
    Task StopConsumingAsync();
}
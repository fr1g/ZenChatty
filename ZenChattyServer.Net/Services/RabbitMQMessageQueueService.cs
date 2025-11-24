using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using ZenChattyServer.Net.Config;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Services;

/// <summary>
/// RabbitMQ消息队列服务实现
/// </summary>
public class RabbitMQMessageQueueService : IMessageQueueService, IDisposable
{
    private readonly IConnection _connection;
    private readonly IModel _channel;
    private readonly UserRelatedContext _context;
    private readonly ILogger<RabbitMQMessageQueueService> _logger;
    private readonly RabbitMQConfig _config;
    private readonly MessageCacheService _messageCacheService;
    private readonly string _queueName = "chat_messages";
    private bool _disposed = false;

    public RabbitMQMessageQueueService(
        UserRelatedContext context,
        IOptions<RabbitMQConfig> config,
        ILogger<RabbitMQMessageQueueService> logger,
        MessageCacheService messageCacheService)
    {
        _config = config.Value;
        _context = context;
        _logger = logger;
        _messageCacheService = messageCacheService;

        // 创建连接工厂
        var factory = new ConnectionFactory
        {
            HostName = _config.HostName,
            UserName = _config.UserName,
            Password = _config.Password,
            Port = _config.Port,
            VirtualHost = _config.VirtualHost
        };

        // 创建连接和通道
        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        // 声明队列（持久化）
        _channel.QueueDeclare(
            queue: _queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null);

        _logger.LogInformation("RabbitMQ service initialized, queue: {QueueName}", _queueName);
    }

    /// <summary>
    /// 发送消息到队列
    /// </summary>
    public async Task SendMessageAsync(Message message)
    {
        try
        {
            var messageJson = JsonSerializer.Serialize(new
            {
                MessageId = message.TraceId,
                ChatUniqueMark = message.OfChatId,
                Content = message.Content,
                MessageType = message.Type,
                SenderId = message.SenderId,
                SentTimestamp = message.SentTimestamp,
                Info = message.Info,
                IsMentioningAll = message.IsMentioningAll,
                MentionedUserGuids = message.MentionedUserGuids
            });

            var body = Encoding.UTF8.GetBytes(messageJson);

            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true; // 消息持久化

            _channel.BasicPublish(
                exchange: "",
                routingKey: _queueName,
                basicProperties: properties,
                body: body);

            _logger.LogInformation("Message sent to queue, ID: {MessageId}", message.TraceId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send message to queue, ID: {MessageId}", message.TraceId);
            throw;
        }
    }

    /// <summary>
    /// 批量发送消息到队列
    /// </summary>
    public async Task SendMessagesAsync(IEnumerable<Message> messages)
    {
        foreach (var message in messages)
        {
            await SendMessageAsync(message);
        }
    }

    /// <summary>
    /// 开始消费消息队列
    /// </summary>
    public async Task StartConsumingAsync()
    {
        var consumer = new EventingBasicConsumer(_channel);
        
        consumer.Received += async (model, ea) =>
        {
            var body = ea.Body.ToArray();
            var messageJson = Encoding.UTF8.GetString(body);
            
            try
            {
                var messageData = JsonSerializer.Deserialize<MessageQueueData>(messageJson);
                if (messageData != null)
                {
                    await ProcessMessageAsync(messageData);
                    _channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process message, content: {MessageJson}", messageJson);
                _channel.BasicNack(deliveryTag: ea.DeliveryTag, multiple: false, requeue: false);
            }
        };

        _channel.BasicConsume(
            queue: _queueName,
            autoAck: false, // todo !!! maycauseproblem 手动确认
            consumer: consumer);

        _logger.LogInformation("Message queue consumption started");
    }

    /// <summary>
    /// 处理消息（保存到数据库并更新未读计数）
    /// </summary>
    private async Task ProcessMessageAsync(MessageQueueData messageData)
    {
        try
        {
            // 查找聊天和发送者
            var chat = await _context.Chats.FirstOrDefaultAsync(c => c.UniqueMark == messageData.ChatUniqueMark);
            var sender = await _context.Users.FindAsync(messageData.SenderId);

            if (chat == null || sender == null)
            {
                _logger.LogWarning("Chat or sender not found, message ID: {MessageId}", messageData.MessageId);
                return;
            }

            // 创建消息实体
            var message = new Message(sender, chat, messageData.Content)
            {
                TraceId = messageData.MessageId,
                Type = messageData.MessageType,
                SentTimestamp = messageData.SentTimestamp,
                ServerCaughtTimestamp = DateTime.UtcNow.ToFileTimeUtc(),
                Info = messageData.Info ?? "",
                IsMentioningAll = messageData.IsMentioningAll,
                MentionedUserGuids = messageData.MentionedUserGuids
            };

            // 保存到数据库
            await _context.Messages.AddAsync(message);
            await _context.SaveChangesAsync();

            // 缓存消息
            _messageCacheService.CacheMessage(message);

            // 更新未读计数（排除发送者自己）
            await IncreaseUnreadCountForChatAsync(messageData.ChatUniqueMark, messageData.SenderId, messageData);

            _logger.LogInformation("Message saved to DB and cached, ID: {MessageId}", messageData.MessageId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save message to DB, ID: {MessageId}", messageData.MessageId);
            throw;
        }
    }

    /// <summary>
    /// 为聊天中的所有联系人增加未读计数，并在特定事件时设置hasVitalUnread为true
    /// </summary>
    private async Task IncreaseUnreadCountForChatAsync(string chatUniqueMark, Guid senderId, MessageQueueData messageData)
    {
        try
        {
            // 获取聊天中的所有联系人
            var contacts = await _context.Contacts
                .Include(c => c.Object)
                .Where(c => c.Object.UniqueMark == chatUniqueMark && c.HostId != senderId)
                .ToListAsync();

            foreach (var contact in contacts)
            {
                // 增加未读计数
                contact.LastUnreadCount++;
                contact.LastUsed = DateTime.UtcNow;
                
                // 检查是否为重要事件，设置hasVitalUnread为true
                if (IsVitalEvent(contact.HostId, messageData))
                {
                    contact.HasVitalUnread = true;
                    _logger.LogDebug("用户 {UserId} 在聊天 {ChatId} 有重要未读消息，设置hasVitalUnread为true", 
                        contact.HostId, chatUniqueMark);
                }
                
                _logger.LogDebug("增加用户 {UserId} 在聊天 {ChatId} 的未读计数，当前: {Count}", 
                    contact.HostId, chatUniqueMark, contact.LastUnreadCount);
            }

            await _context.SaveChangesAsync();
            
            _logger.LogInformation("已更新聊天 {ChatId} 的未读计数，影响用户数: {UserCount}", 
                chatUniqueMark, contacts.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新未读计数失败，聊天: {ChatId}", chatUniqueMark);
        }
    }

    /// <summary>
    /// 检查是否为重要事件（@提及、群公告、@全体）
    /// </summary>
    private static bool IsVitalEvent(Guid userId, MessageQueueData messageData)
    {
        return (messageData.MessageType == EMessageType.Announcement) ||
               (messageData.IsMentioningAll) ||
               (messageData.MentionedUserGuids != null && messageData.MentionedUserGuids.Contains(userId.ToString())) ;
    }

    /// <summary>
    /// 停止消费消息队列
    /// </summary>
    public async Task StopConsumingAsync()
    {
        _channel?.Close();
        _connection?.Close();
        _logger.LogInformation("Message queue consumption stopped");
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing)
        {
            _channel?.Dispose();
            _connection?.Dispose();
        }
        _disposed = true;
    }

    /// <summary>
    /// 消息队列数据结构
    /// </summary>
    private class MessageQueueData
    {
        public string MessageId { get; set; } = string.Empty;
        public string ChatUniqueMark { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public EMessageType MessageType { get; set; }
        public Guid SenderId { get; set; }
        public long SentTimestamp { get; set; }
        public string? Info { get; set; }
        public bool IsMentioningAll { get; set; }
        public string[]? MentionedUserGuids { get; set; }
    }
}
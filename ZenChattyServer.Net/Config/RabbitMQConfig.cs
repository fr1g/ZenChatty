namespace ZenChattyServer.Net.Config;

/// <summary>
/// RabbitMQ配置模型
/// </summary>
public class RabbitMQConfig
{
    public string HostName { get; set; } = "localhost";
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public int Port { get; set; } = 5672;
    public string VirtualHost { get; set; } = "/";
    public string QueueName { get; set; } = "chatty_chat_messages";
    public int PrefetchCount { get; set; } = 100; // 每次预取的消息数量
    public int BatchSize { get; set; } = 50; // 批量处理大小
    public int RetryCount { get; set; } = 3; // 重试次数
}
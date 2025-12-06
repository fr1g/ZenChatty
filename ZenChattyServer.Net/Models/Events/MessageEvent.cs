using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Models.Events;

/// <summary>
/// 消息事件基类
/// </summary>
public abstract class MessageEvent
{
    /// <summary>
    /// 事件类型
    /// </summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>
    /// 聊天唯一标识符
    /// </summary>
    public string ChatUniqueMark { get; set; } = string.Empty;

    /// <summary>
    /// 事件发生时间戳
    /// </summary>
    public long Timestamp { get; set; }

    protected MessageEvent(string eventType, string chatUniqueMark)
    {
        EventType = eventType;
        ChatUniqueMark = chatUniqueMark;
        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }
}

/// <summary>
/// 新消息事件
/// </summary>
public class IncomeMessageEvent : MessageEvent
{
    /// <summary>
    /// 消息对象
    /// </summary>
    public Message Message { get; set; }

    public IncomeMessageEvent(string chatUniqueMark, Message message) 
        : base("IncomeMessage", chatUniqueMark)
    {
        Message = message;
    }
}

/// <summary>
/// 消息更新事件
/// </summary>
public class PatchMessageEvent : MessageEvent
{
    /// <summary>
    /// 更新后的消息对象
    /// </summary>
    public Message UpdatedMessage { get; set; }

    /// <summary>
    /// 更新类型
    /// </summary>
    public string UpdateType { get; set; } = "content";

    public PatchMessageEvent(string chatUniqueMark, Message updatedMessage, string updateType = "content") 
        : base("PatchMessage", chatUniqueMark)
    {
        UpdatedMessage = updatedMessage;
        UpdateType = updateType;
    }
}

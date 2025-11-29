using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Services;

public class ChatService
{
    private readonly UserRelatedContext _context;
    private readonly ChatQueryHelper _chatQueryHelper;

    public ChatService(UserRelatedContext context, ChatQueryHelper chatQueryHelper)
    {
        _context = context;
        _chatQueryHelper = chatQueryHelper;
    }

    /// <summary>
    /// 获取聊天列表（轻量级查询，不包含历史消息）
    /// </summary>
    public async Task<List<Chat>> GetUserChatListAsync(Guid userId)
    {
        // 使用轻量级查询，只获取基本信息
        return await _chatQueryHelper.GetUserChatsBasicInfoAsync(userId);
    }

    /// <summary>
    /// 获取单个聊天详细信息（按需加载历史消息）
    /// </summary>
    public async Task<Chat?> GetChatDetailAsync(string chatUniqueMark, bool includeHistory = false, int? messageLimit = null)
    {
        if (includeHistory)
        {
            // 需要历史消息时，按需查询
            return await _chatQueryHelper.GetChatWithHistoryAsync(chatUniqueMark, messageLimit);
        }
        else
        {
            // 只需要基本信息
            return await _chatQueryHelper.GetChatBasicInfoAsync(chatUniqueMark);
        }
    }

    /// <summary>
    /// 分页获取聊天历史消息
    /// </summary>
    public async Task<List<Message>> GetChatHistoryAsync(string chatUniqueMark, int pageNumber = 1, int pageSize = 20)
    {
        return await _chatQueryHelper.GetChatHistoryPagedAsync(chatUniqueMark, pageNumber, pageSize);
    }

    /// <summary>
    /// 获取私聊信息
    /// </summary>
    public async Task<PrivateChat?> GetPrivateChatAsync(string chatUniqueMark)
    {
        return await _chatQueryHelper.GetPrivateChatBasicInfoAsync(chatUniqueMark);
    }

    /// <summary>
    /// 获取群聊信息
    /// </summary>
    public async Task<GroupChat?> GetGroupChatAsync(string chatUniqueMark)
    {
        return await _chatQueryHelper.GetGroupChatBasicInfoAsync(chatUniqueMark);
    }

    /// <summary>
    /// 获取聊天统计信息
    /// </summary>
    public async Task<ChatStats> GetChatStatsAsync(string chatUniqueMark)
    {
        return await _chatQueryHelper.GetChatStatsAsync(chatUniqueMark);
    }

    /// <summary>
    /// 创建新聊天（演示延迟加载的使用）
    /// </summary>
    public async Task<Chat> CreateChatAsync(Guid initById, string? title = null)
    {
        var initBy = await _context.Users.FindAsync(initById);
        if (initBy == null)
            throw new ArgumentException("用户不存在");

        var chat = new Chat(initBy)
        {
            Status = EChatStatus.Normal
        };

        _context.Chats.Add(chat);
        await _context.SaveChangesAsync();

        return chat;
    }

    /// <summary>
    /// 发送消息（演示延迟加载的威力）
    /// </summary>
    public async Task<Message> SendMessageAsync(string chatUniqueMark, Guid senderId, string content, EMessageType messageType = EMessageType.Normal)
    {
        // 这里只会查询聊天基本信息，不会加载历史消息
        var chat = await _context.Chats
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
            
        if (chat == null)
            throw new ArgumentException("聊天不存在");

        var sender = await _context.Users.FindAsync(senderId);
        if (sender == null)
            throw new ArgumentException("发送者不存在");

        var message = new Message(sender, chat, content)
        {
            Type = messageType,
            SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return message;
    }

    /// <summary>
    /// 获取聊天的最新消息（轻量级查询）
    /// </summary>
    public async Task<Message?> GetLatestMessageAsync(string chatUniqueMark)
    {
        return await _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.OfChat.UniqueMark == chatUniqueMark)
            .OrderByDescending(m => m.SentTimestamp)
            .FirstOrDefaultAsync();
    }
}
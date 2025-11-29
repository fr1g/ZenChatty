using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Helpers;

public class ChatQueryHelper
{
    private readonly UserRelatedContext _context;

    public ChatQueryHelper(UserRelatedContext context)
    {
        _context = context;
    }

    /// <summary>
    /// 获取聊天基本信息（不包含历史消息）
    /// </summary>
    public async Task<Chat?> GetChatBasicInfoAsync(string chatUniqueMark)
    {
        return await _context.Chats
            .AsNoTracking() // 提高查询性能
            .Include(c => c.InitBy) // 只包含必要的导航属性
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
    }

    /// <summary>
    /// 获取聊天基本信息列表（不包含历史消息）
    /// </summary>
    public async Task<List<Chat>> GetChatsBasicInfoAsync(List<string> chatUniqueMarks)
    {
        return await _context.Chats
            .AsNoTracking()
            .Include(c => c.InitBy)
            .Where(c => chatUniqueMarks.Contains(c.UniqueMark))
            .ToListAsync();
    }

    /// <summary>
    /// 获取聊天详细信息（包含历史消息）
    /// </summary>
    public async Task<Chat?> GetChatWithHistoryAsync(string chatUniqueMark, int? messageLimit = null)
    {
        var query = _context.Chats
            .Include(c => c.InitBy)
            .Include(c => c.History.OrderByDescending(m => m.SentTimestamp).Take(messageLimit ?? 50)) // 限制消息数量
            .Where(c => c.UniqueMark == chatUniqueMark);

        return await query.FirstOrDefaultAsync();
    }

    /// <summary>
    /// 分页获取聊天历史消息
    /// </summary>
    public async Task<List<Message>> GetChatHistoryPagedAsync(string chatUniqueMark, int pageNumber = 1, int pageSize = 20)
    {
        return await _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.OfChat.UniqueMark == chatUniqueMark)
            .OrderByDescending(m => m.SentTimestamp)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    /// <summary>
    /// 获取用户的所有聊天基本信息
    /// </summary>
    public async Task<List<Chat>> GetUserChatsBasicInfoAsync(Guid userId)
    {
        return await _context.Chats
            .AsNoTracking()
            .Include(c => c.InitBy)
            .Where(c => c.InitById == userId || 
                       c.Contacts.Any(contact => contact.HostId == userId))
            .ToListAsync();
    }

    /// <summary>
    /// 获取私聊基本信息
    /// </summary>
    public async Task<PrivateChat?> GetPrivateChatBasicInfoAsync(string chatUniqueMark)
    {
        return await _context.PrivateChats
            .AsNoTracking()
            .Include(pc => pc.InitBy)
            .Include(pc => pc.Receiver)
            .FirstOrDefaultAsync(pc => pc.UniqueMark == chatUniqueMark);
    }

    /// <summary>
    /// 获取群聊基本信息
    /// </summary>
    public async Task<GroupChat?> GetGroupChatBasicInfoAsync(string chatUniqueMark)
    {
        return await _context.GroupChats
            .AsNoTracking()
            .Include(gc => gc.InitBy)
            .Include(gc => gc.Members)
            .FirstOrDefaultAsync(gc => gc.UniqueMark == chatUniqueMark);
    }

    /// <summary>
    /// 检查聊天是否存在（轻量级查询）
    /// </summary>
    public async Task<bool> ChatExistsAsync(string chatUniqueMark)
    {
        return await _context.Chats
            .AsNoTracking()
            .AnyAsync(c => c.UniqueMark == chatUniqueMark);
    }

    /// <summary>
    /// 获取聊天统计信息（消息数量等）
    /// </summary>
    public async Task<ChatStats> GetChatStatsAsync(string chatUniqueMark)
    {
        var messageCount = await _context.Messages
            .AsNoTracking()
            .CountAsync(m => m.OfChat.UniqueMark == chatUniqueMark);

        var lastMessage = await _context.Messages
            .AsNoTracking()
            .Where(m => m.OfChat.UniqueMark == chatUniqueMark)
            .OrderByDescending(m => m.SentTimestamp)
            .Select(m => new { SentAt = DateTimeOffset.FromUnixTimeMilliseconds(m.SentTimestamp).UtcDateTime, m.Content })
            .FirstOrDefaultAsync();

        return new ChatStats
        {
            MessageCount = messageCount,
            LastMessageAt = lastMessage?.SentAt,
            LastMessagePreview = lastMessage?.Content?.Substring(0, Math.Min(50, lastMessage.Content.Length))
        };
    }
}

public class ChatStats
{
    public int MessageCount { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public string? LastMessagePreview { get; set; }
}
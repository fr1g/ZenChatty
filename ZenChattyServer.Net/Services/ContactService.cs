using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Services;

/// <summary>
/// 联系人服务 - 管理未读消息计数
/// </summary>
public class ContactService(UserRelatedContext context, ILogger<ContactService> logger)
{
    /// <summary>
    /// 增加聊天中所有联系人的未读计数
    /// </summary>
    public async Task IncreaseUnreadCountAsync(string chatUniqueMark, Guid? excludeUserId = null)
    {
        try
        {
            // 获取聊天中的所有联系人
            var contacts = await context.Contacts
                .Include(c => c.Object)
                .Where(c => c.Object.UniqueMark == chatUniqueMark)
                .ToListAsync();

            foreach (var contact in contacts)
            {
                // 排除发送者自己（如果指定）
                if (excludeUserId.HasValue && contact.HostId == excludeUserId.Value)
                    continue;

                // 增加未读计数
                contact.LastUnreadCount++;
                contact.LastUsed = DateTime.UtcNow;
                
                logger.LogDebug("增加用户 {UserId} 在聊天 {ChatId} 的未读计数，当前: {Count}", 
                    contact.HostId, chatUniqueMark, contact.LastUnreadCount);
            }

            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "增加未读计数失败，聊天: {ChatId}", chatUniqueMark);
            throw;
        }
    }

    /// <summary>
    /// 重置用户的未读计数（当用户查看聊天时）
    /// </summary>
    public async Task ResetUnreadCountAsync(Guid userId, string chatUniqueMark)
    {
        try
        {
            var contact = await context.Contacts
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => c.HostId == userId && c.Object.UniqueMark == chatUniqueMark);

            if (contact != null)
            {
                var oldCount = contact.LastUnreadCount;
                var hadVitalUnread = contact.HasVitalUnread;
                
                contact.LastUnreadCount = 0;
                contact.HasVitalUnread = false; // 重置重要未读标记
                contact.LastUsed = DateTime.UtcNow;

                await context.SaveChangesAsync();
                
                logger.LogDebug("重置用户 {UserId} 在聊天 {ChatId} 的未读计数，原值: {OldCount}, 原重要标记: {HadVital}", 
                    userId, chatUniqueMark, oldCount, hadVitalUnread);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "重置未读计数失败，用户: {UserId}, 聊天: {ChatId}", userId, chatUniqueMark);
            throw;
        }
    }

    /// <summary>
    /// 获取用户的所有联系人未读计数
    /// </summary>
    public async Task<Dictionary<string, ushort>> GetUserUnreadCountsAsync(Guid userId)
    {
        try
        {
            var contacts = await context.Contacts
                .Include(c => c.Object)
                .Where(c => c.HostId == userId)
                .Select(c => new { c.Object.UniqueMark, c.LastUnreadCount })
                .ToListAsync();

            return contacts.ToDictionary(c => c.UniqueMark, c => c.LastUnreadCount);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "获取用户未读计数失败，用户: {UserId}", userId);
            return new Dictionary<string, ushort>();
        }
    }

    /// <summary>
    /// 获取用户的总未读消息数
    /// </summary>
    public async Task<int> GetTotalUnreadCountAsync(Guid userId)
    {
        try
        {
            return await context.Contacts
                .Where(c => c.HostId == userId)
                .SumAsync(c => (int)c.LastUnreadCount);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "获取总未读计数失败，用户: {UserId}", userId);
            return 0;
        }
    }

    /// <summary>
    /// 获取用户的联系人列表（包含未读计数）
    /// </summary>
    public async Task<List<Contact>> GetUserContactsAsync(Guid userId)
    {
        try
        {
            // 使用 AsNoTracking 避免 EF Core 生成代理类，否则 JSON 多态序列化会失败
            return await context.Contacts
                .AsNoTracking()
                .Include(c => c.Object)
                .Include(c => c.Object.History.OrderByDescending(m => m.SentTimestamp).Take(1))
                .Where(c => c.HostId == userId)
                .OrderByDescending(c => c.LastUsed)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "获取联系人列表失败，用户: {UserId}", userId);
            return new List<Contact>();
        }
    }
}
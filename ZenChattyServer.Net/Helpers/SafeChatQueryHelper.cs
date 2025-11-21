using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Helpers;

/// <summary>
/// 安全的Chat查询助手，确保不会意外加载历史消息
/// </summary>
public class SafeChatQueryHelper
{
    private readonly UserRelatedContext _context;

    public SafeChatQueryHelper(UserRelatedContext context)
    {
        _context = context;
    }

    /// <summary>
    /// 安全的查询 - 只获取Chat基本信息
    /// </summary>
    public IQueryable<Chat> GetChatsBasicQuery()
    {
        return _context.Chats
            .AsNoTracking()
            .Include(c => c.InitBy); // 只包含必要的导航属性
    }

    /// <summary>
    /// 安全的查询 - 获取PrivateChat基本信息
    /// </summary>
    public IQueryable<PrivateChat> GetPrivateChatsBasicQuery()
    {
        return _context.PrivateChats
            .AsNoTracking()
            .Include(pc => pc.InitBy)
            .Include(pc => pc.Receiver);
    }

    /// <summary>
    /// 安全的查询 - 获取GroupChat基本信息
    /// </summary>
    public IQueryable<GroupChat> GetGroupChatsBasicQuery()
    {
        return _context.GroupChats
            .AsNoTracking()
            .Include(gc => gc.InitBy);
    }

    /// <summary>
    /// 禁用延迟加载的查询（用于性能敏感场景）
    /// </summary>
    public IQueryable<Chat> GetChatsWithoutLazyLoading()
    {
        return _context.Chats
            .AsNoTracking()
            .IgnoreAutoIncludes(); // 禁用所有自动Include
    }

    /// <summary>
    /// 检查是否需要显式禁用延迟加载
    /// </summary>
    public IQueryable<T> GetSafeQuery<T>(bool disableLazyLoading = false) where T : class
    {
        var query = _context.Set<T>().AsNoTracking();
        
        if (disableLazyLoading)
        {
            query = query.IgnoreAutoIncludes();
        }
        
        return query;
    }
}

/// <summary>
/// 查询选项，用于控制查询行为
/// </summary>
public class ChatQueryOptions
{
    public bool IncludeHistory { get; set; } = false;
    public bool IncludeContacts { get; set; } = false;
    public bool DisableLazyLoading { get; set; } = true;
    public int? MessageLimit { get; set; } = null;
}
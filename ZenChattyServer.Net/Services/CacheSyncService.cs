using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Services;

/// <summary>
/// 缓存同步服务，确保缓存与数据库的一致性
/// </summary>
public class CacheSyncService
{
    private readonly UserRelatedContext _context;
    private readonly MessageCacheService _messageCacheService;
    private readonly ILogger<CacheSyncService> _logger;

    public CacheSyncService(
        UserRelatedContext context,
        MessageCacheService messageCacheService,
        ILogger<CacheSyncService> logger)
    {
        _context = context;
        _messageCacheService = messageCacheService;
        _logger = logger;
    }

    /// <summary>
    /// 异步同步缓存与数据库
    /// </summary>
    public async Task SyncCacheWithDatabaseAsync()
    {
        _logger.LogInformation("开始缓存同步...");
        
        try
        {
            // 获取所有活跃聊天的ID（最近有消息的聊天）
            var activeChatIds = await _context.Messages
                .Where(m => m.SentTimestamp > DateTime.UtcNow.AddHours(-24).ToFileTimeUtc()) // 最近24小时有消息
                .Select(m => m.OfChatId)
                .Distinct()
                .ToListAsync();

            var syncCount = 0;
            
            foreach (var chatId in activeChatIds)
            {
                try
                {
                    // 获取数据库中最新的消息
                    var latestDbMessages = await _context.Messages
                        .Where(m => m.OfChatId == chatId)
                        .OrderByDescending(m => m.SentTimestamp)
                        .Take(100) // 只同步最新的100条消息
                        .ToListAsync();

                    if (latestDbMessages.Any())
                    {
                        // 获取缓存中的消息
                        var cachedMessages = _messageCacheService.GetCachedMessages(chatId);
                        
                        // 检查缓存是否与数据库一致
                        var needsSync = !IsCacheInSync(cachedMessages, latestDbMessages);
                        
                        if (needsSync)
                        {
                            // 清除缓存并重新缓存最新消息
                            _messageCacheService.ClearChatCache(chatId);
                            _messageCacheService.CacheMessages(latestDbMessages);
                            syncCount++;
                            
                            _logger.LogDebug("同步聊天 {ChatId} 的缓存，消息数量: {Count}", chatId, latestDbMessages.Count);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "同步聊天 {ChatId} 缓存失败", chatId);
                }
            }
            
            _logger.LogInformation("缓存同步完成，同步了 {SyncCount} 个聊天", syncCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "缓存同步过程失败");
        }
    }

    /// <summary>
    /// 检查缓存是否与数据库同步
    /// </summary>
    private bool IsCacheInSync(List<Message> cachedMessages, List<Message> dbMessages)
    {
        if (cachedMessages.Count != dbMessages.Count)
            return false;

        // 检查消息ID是否一致
        var cachedIds = cachedMessages.Select(m => m.TraceId).ToHashSet();
        var dbIds = dbMessages.Select(m => m.TraceId).ToHashSet();
        
        return cachedIds.SetEquals(dbIds);
    }

    /// <summary>
    /// 手动触发缓存同步
    /// </summary>
    public async Task TriggerSyncAsync()
    {
        await SyncCacheWithDatabaseAsync();
    }

    /// <summary>
    /// 手动同步指定聊天的缓存
    /// </summary>
    public async Task SyncChatCacheAsync(string chatId)
    {
        try
        {
            // 获取数据库中最新的消息
            var latestDbMessages = await _context.Messages
                .Where(m => m.OfChatId == chatId)
                .OrderByDescending(m => m.SentTimestamp)
                .Take(100)
                .ToListAsync();

            if (latestDbMessages.Any())
            {
                // 清除缓存并重新缓存最新消息
                _messageCacheService.ClearChatCache(chatId);
                _messageCacheService.CacheMessages(latestDbMessages);
                
                _logger.LogInformation("手动同步聊天 {ChatId} 缓存完成，消息数量: {Count}", chatId, latestDbMessages.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "手动同步聊天 {ChatId} 缓存失败", chatId);
        }
    }

    /// <summary>
    /// 释放资源
    /// </summary>
    public void Dispose()
    {
        // 由于移除了定时器，这里不需要释放任何资源
    }
}
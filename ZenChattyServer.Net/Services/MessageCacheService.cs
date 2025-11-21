using Microsoft.Extensions.Caching.Memory;
using ZenChattyServer.Net.Models;

namespace ZenChattyServer.Net.Services;

/// <summary>
/// 消息缓存服务
/// </summary>
public class MessageCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<MessageCacheService> _logger;
    private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(30); // 缓存30分钟
    private readonly int _maxCachedMessagesPerChat = 1000; // 每个聊天最多缓存1000条消息

    public MessageCacheService(
        IMemoryCache memoryCache,
        ILogger<MessageCacheService> logger)
    {
        _memoryCache = memoryCache;
        _logger = logger;
    }

    /// <summary>
    /// 缓存消息
    /// </summary>
    public void CacheMessage(Message message)
    {
        try
        {
            if (message == null)
            {
                _logger.LogWarning("Attempting to cache null message");
                return;
            }

            var cacheKey = GetChatMessagesKey(message.OfChatId);
            
            if (!_memoryCache.TryGetValue(cacheKey, out List<Message> cachedMessages))
            {
                cachedMessages = new List<Message>();
            }

            // 添加新消息到缓存
            cachedMessages.Add(message);
            
            // 限制缓存大小，移除最旧的消息
            if (cachedMessages.Count > _maxCachedMessagesPerChat)
            {
                cachedMessages = cachedMessages
                    .OrderByDescending(m => m.SentTimestamp)
                    .Take(_maxCachedMessagesPerChat)
                    .ToList();
            }

            // 更新缓存
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = _cacheExpiration
            };
            
            _memoryCache.Set(cacheKey, cachedMessages, cacheOptions);
            
            _logger.LogDebug("Message cached, chat ID: {ChatId}, message ID: {MessageId}", message.OfChatId, message.TraceId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cache message, ID: {MessageId}", message.TraceId);
        }
    }

    /// <summary>
    /// 批量缓存消息
    /// </summary>
    public void CacheMessages(IEnumerable<Message> messages)
    {
        foreach (var message in messages)
        {
            CacheMessage(message);
        }
    }

    /// <summary>
    /// 从缓存获取聊天消息
    /// </summary>
    public List<Message> GetCachedMessages(string chatUniqueMark)
    {
        try
        {
            var cacheKey = GetChatMessagesKey(chatUniqueMark);
            
            if (_memoryCache.TryGetValue(cacheKey, out List<Message> cachedMessages) && cachedMessages != null)
            {
                _logger.LogDebug("Messages retrieved from cache, chat ID: {ChatId}, count: {Count}", 
                    chatUniqueMark, cachedMessages.Count);
                return cachedMessages;
            }
            
            return new List<Message>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get cached messages, chat ID: {ChatId}", chatUniqueMark);
            return new List<Message>();
        }
    }

    /// <summary>
    /// 获取聊天的最新消息（包含缓存和数据库的合并结果）
    /// </summary>
    public async Task<List<Message>> GetChatMessagesAsync(
        string chatUniqueMark, 
        int page = 1, 
        int pageSize = 50,
        Func<string, int, int, Task<List<Message>>> databaseQuery = null)
    {
        try
        {
            // 从缓存获取消息
            var cachedMessages = GetCachedMessages(chatUniqueMark);
            
            // 如果没有数据库查询函数，直接返回缓存消息
            if (databaseQuery == null)
            {
                return cachedMessages
                    .OrderByDescending(m => m.SentTimestamp)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .OrderBy(m => m.SentTimestamp)
                    .ToList();
            }

            // 计算需要从数据库查询的消息数量
            var cachedCount = cachedMessages.Count;
            var totalNeeded = page * pageSize;
            
            if (cachedCount >= totalNeeded)
            {
                // 缓存中已有足够的数据
                return cachedMessages
                    .OrderByDescending(m => m.SentTimestamp)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .OrderBy(m => m.SentTimestamp)
                    .ToList();
            }
            else
            {
                // 需要从数据库查询更多数据
                var dbMessages = await databaseQuery(chatUniqueMark, page, pageSize);
                
                // 合并缓存和数据库的消息
                var allMessages = cachedMessages
                    .UnionBy(dbMessages, m => m.TraceId) // 去重
                    .OrderByDescending(m => m.SentTimestamp)
                    .ToList();
                
                // 返回请求的页面
                return allMessages
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .OrderBy(m => m.SentTimestamp)
                    .ToList();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get chat messages, chat ID: {ChatId}", chatUniqueMark);
            
            // 降级到直接查询数据库
            if (databaseQuery != null)
            {
                return await databaseQuery(chatUniqueMark, page, pageSize);
            }
            
            return new List<Message>();
        }
    }

    /// <summary>
    /// 清除聊天缓存
    /// </summary>
    public void ClearChatCache(string chatUniqueMark)
    {
        try
        {
            var cacheKey = GetChatMessagesKey(chatUniqueMark);
            _memoryCache.Remove(cacheKey);
            _logger.LogDebug("Chat cache cleared, chat ID: {ChatId}", chatUniqueMark);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear chat cache, chat ID: {ChatId}", chatUniqueMark);
        }
    }

    /// <summary>
    /// 从缓存中移除指定消息
    /// </summary>
    public void RemoveMessage(string chatUniqueMark, string messageTraceId)
    {
        try
        {
            var cacheKey = GetChatMessagesKey(chatUniqueMark);
            
            if (_memoryCache.TryGetValue(cacheKey, out List<Message> cachedMessages) && cachedMessages != null)
            {
                // 查找并移除指定消息
                var messageToRemove = cachedMessages.FirstOrDefault(m => m.TraceId == messageTraceId);
                if (messageToRemove != null)
                {
                    cachedMessages.Remove(messageToRemove);
                    
                    // 更新缓存
                    var cacheOptions = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = _cacheExpiration
                    };
                    
                    _memoryCache.Set(cacheKey, cachedMessages, cacheOptions);
                    
                    _logger.LogDebug("Message removed from cache, chat ID: {ChatId}, message ID: {MessageId}", 
                        chatUniqueMark, messageTraceId);
                }
                else
                {
                    _logger.LogDebug("Message not found in cache, chat ID: {ChatId}, message ID: {MessageId}", 
                        chatUniqueMark, messageTraceId);
                }
            }
            else
            {
                _logger.LogDebug("Chat cache not found, chat ID: {ChatId}", chatUniqueMark);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove message from cache, chat ID: {ChatId}, message ID: {MessageId}", 
                chatUniqueMark, messageTraceId);
        }
    }

    /// <summary>
    /// 获取缓存键
    /// </summary>
    private static string GetChatMessagesKey(string chatUniqueMark)
    {
        return $"ChatMessages_{chatUniqueMark}";
    }
}
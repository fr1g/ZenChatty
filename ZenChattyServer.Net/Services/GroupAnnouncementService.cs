using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Services;

public class GroupAnnouncementService
{
    private readonly UserRelatedContext _context;
    private readonly ILogger<GroupAnnouncementService> _logger;

    public GroupAnnouncementService(UserRelatedContext context, ILogger<GroupAnnouncementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 将普通消息标记为群公告
    /// </summary>
    public async Task<(bool success, string message)> MarkMessageAsAnnouncementAsync(
        string operatorUserId, string messageId)
    {
        try
        {
            var message = await _context.Messages
                .Include(m => m.OfChat)
                .FirstOrDefaultAsync(m => m.TraceId == messageId);

            if (message == null)
                return (false, "消息不存在");

            // 验证消息是否在群聊中
            if (string.IsNullOrEmpty(message.OfChatId) || !(message.OfChat is GroupChat))
                return (false, "只能在群聊中设置公告");

            var groupChat = await _context.GroupChats
                .Include(gc => gc.Members)
                .Include(gc => gc.AnnouncementMessages)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == message.OfChatId);

            if (groupChat == null)
                return (false, "群聊不存在");

            var operatorMember = groupChat.Members.FirstOrDefault(m => 
                m.TheGuyId.ToString() == operatorUserId);

            if (operatorMember == null)
                return (false, "不是群成员");

            // 检查权限（群主或管理员）
            if (operatorMember.Type != EGroupMemberType.Owner && 
                operatorMember.Type != EGroupMemberType.Admin)
                return (false, "没有权限设置公告");

            // 检查消息是否已经是公告
            if (message.IsAnnouncement)
                return (false, "该消息已经是公告");

            // 标记消息为公告
            message.IsAnnouncement = true;
            message.Type = EMessageType.Announcement;

            // 将消息添加到群聊的公告集合中
            groupChat.AnnouncementMessages.Add(message);

            await _context.SaveChangesAsync();

            // 重新推送公告消息给所有群成员，设置hasVitalUnread为true
            await RepushAnnouncementMessageAsync(messageId);

            return (true, "标记为公告成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "标记公告失败");
            return (false, "标记公告失败");
        }
    }

    /// <summary>
    /// 获取群公告列表（从群聊的公告集合中获取）
    /// </summary>
    public async Task<List<Message>> GetAnnouncementsAsync(string groupId, User user, int page = 1, int pageSize = 20)
    {
        try
        {
            var groupChat = await _context.GroupChats
                .Include(gc => gc.AnnouncementMessages)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == groupId);
            if (!RelationshipHelper.IsUserGroupMember(user, groupChat)) throw new Exception("Not a member");

            if (groupChat == null)
                return new List<Message>();

            return groupChat.AnnouncementMessages
                .Where(m => m.IsAnnouncement)
                .OrderByDescending(m => m.SentTimestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取公告列表失败");
            return new List<Message>();
        }
    }

    /// <summary>
    /// 取消消息的公告标记
    /// </summary>
    public async Task<(bool success, string message)> UnmarkAnnouncementAsync(
        string operatorUserId, string messageId)
    {
        try
        {
            var message = await _context.Messages
                .Include(m => m.OfChat)
                .FirstOrDefaultAsync(m => m.TraceId == messageId);

            if (message == null)
                return (false, "消息不存在");

            // 验证消息是否在群聊中
            if (string.IsNullOrEmpty(message.OfChatId) || !(message.OfChat is GroupChat))
                return (false, "只能在群聊中取消公告标记");

            var groupChat = await _context.GroupChats
                .Include(gc => gc.Members)
                .Include(gc => gc.AnnouncementMessages)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == message.OfChatId);

            if (groupChat == null)
                return (false, "群聊不存在");

            var operatorMember = groupChat.Members.FirstOrDefault(m => 
                m.TheGuyId.ToString() == operatorUserId);

            if (operatorMember == null)
                return (false, "不是群成员");

            // 检查权限（群主或管理员）
            if (operatorMember.Type != EGroupMemberType.Owner && 
                operatorMember.Type != EGroupMemberType.Admin)
                return (false, "没有权限取消公告标记");

            // 检查消息是否已经是公告
            if (!message.IsAnnouncement)
                return (false, "该消息不是公告");

            // 取消公告标记
            message.IsAnnouncement = false;
            message.Type = EMessageType.Normal;

            // 从群聊的公告集合中移除
            groupChat.AnnouncementMessages.Remove(message);

            await _context.SaveChangesAsync();

            return (true, "取消公告标记成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "取消公告标记失败");
            return (false, "取消公告标记失败");
        }
    }

    /// <summary>
    /// 重新推送公告消息给所有群成员（用于消息被标记为公告时）
    /// </summary>
    public async Task<bool> RepushAnnouncementMessageAsync(string messageId)
    {
        try
        {
            var message = await _context.Messages
                .Include(m => m.OfChat)
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.TraceId == messageId);

            if (message == null || !message.IsAnnouncement)
                return false;

            // 获取群聊中的所有联系人
            var contacts = await _context.Contacts
                .Include(c => c.Object)
                .Where(c => c.Object.UniqueMark == message.OfChatId)
                .ToListAsync();

            // 模拟消息队列数据，用于触发重要事件检测
            var messageData = new MessageQueueData
            {
                MessageId = message.TraceId,
                ChatUniqueMark = message.OfChatId,
                Content = message.Content,
                MessageType = EMessageType.Announcement,
                SenderId = message.SenderId,
                SentTimestamp = message.SentTimestamp,
                Info = message.Info,
                IsMentioningAll = message.IsMentioningAll,
                MentionedUserGuids = message.MentionedUserGuids
            };

            // 为所有群成员设置hasVitalUnread为true
            foreach (var contact in contacts)
            {
                contact.HasVitalUnread = true;
                contact.LastUnreadCount++;
                contact.LastUsed = DateTime.UtcNow;
                
                _logger.LogDebug("为用户 {UserId} 设置公告消息的重要未读标记", contact.HostId);
            }

            await _context.SaveChangesAsync();
            
            _logger.LogInformation("重新推送公告消息 {MessageId}，影响用户数: {UserCount}", 
                messageId, contacts.Count);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "重新推送公告消息失败，消息ID: {MessageId}", messageId);
            return false;
        }
    }

    /// <summary>
    /// 内部使用的消息队列数据结构
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
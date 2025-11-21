using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Request;

namespace ZenChattyServer.Net.Services;

public class GroupInviteLinkService
{
    private readonly UserRelatedContext _context;
    private readonly ILogger<GroupInviteLinkService> _logger;

    public GroupInviteLinkService(UserRelatedContext context, ILogger<GroupInviteLinkService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 创建群邀请链接
    /// </summary>
    public async Task<(bool success, string message, GroupInviteLink? link)> CreateInviteLinkAsync(
        string operatorUserId, GroupInviteLinkRequest request)
    {
        try
        {
            // 验证群聊和操作权限
            var groupChat = await _context.GroupChats
                .Include(gc => gc.Members)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == request.GroupId);

            if (groupChat == null)
                return (false, "群聊不存在", null);

            var operatorMember = groupChat.Members.FirstOrDefault(m => 
                m.TheGuyId.ToString() == operatorUserId);

            if (operatorMember == null)
                return (false, "不是群成员", null);

            // 检查权限（群主或管理员）
            if (operatorMember.Type != Models.Enums.EGroupMemberType.Owner && 
                operatorMember.Type != Models.Enums.EGroupMemberType.Admin)
                return (false, "没有权限创建邀请链接", null);

            // 生成邀请码
            var inviteCode = GenerateInviteCode();
            
            // 创建邀请链接
            var link = new GroupInviteLink
            {
                Id = Guid.NewGuid(),
                GroupId = request.GroupId,
                CreatedByUserId = operatorUserId,
                InviteCode = inviteCode,
                IsPublic = request.IsPublic,
                TargetUserId = request.TargetUserId,
                ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(7),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.GroupInviteLinks.Add(link);
            await _context.SaveChangesAsync();

            return (true, "创建邀请链接成功", link);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建邀请链接失败");
            return (false, "创建邀请链接失败", null);
        }
    }

    /// <summary>
    /// 验证邀请链接并加入群聊
    /// </summary>
    public async Task<(bool success, string message, GroupChat? groupChat)> JoinGroupByInviteLinkAsync(
        string inviteCode, string targetUserId)
    {
        try
        {
            // 查找有效的邀请链接
            var link = await _context.GroupInviteLinks
                .Include(l => l.Group)
                .ThenInclude(g => g.Members)
                .FirstOrDefaultAsync(l => l.InviteCode == inviteCode && 
                                         !l.IsUsed && 
                                         l.ExpiresAt > DateTime.UtcNow);

            if (link == null)
                return (false, "邀请链接无效或已过期", null);

            // 检查群聊是否被禁用
            if (link.Group?.Status == Models.Enums.EChatStatus.GroupDisabled)
                return (false, "群聊已被禁用，无法加入", null);

            // 检查邀请人是否还是群成员且具有管理员权限
            var groupChat = link.Group;
            var inviterMember = groupChat.Members.FirstOrDefault(m => 
                m.TheGuyId.ToString() == link.CreatedByUserId);
            
            if (inviterMember == null || 
                (inviterMember.Type != Models.Enums.EGroupMemberType.Owner && 
                 inviterMember.Type != Models.Enums.EGroupMemberType.Admin))
                return (false, "邀请人已不是管理员或已退群，邀请链接无效", null);

            // 检查链接是否针对特定用户
            if (!string.IsNullOrEmpty(link.TargetUserId))
            {
                if (link.TargetUserId != targetUserId)
                    return (false, "此邀请链接不是为您创建的", null);
            }

            // 检查用户是否已经是群成员
            if (groupChat.Members.Any(m => m.TheGuyId.ToString() == targetUserId))
                return (false, "您已经是群成员", null);

            // 查找目标用户
            var targetUser = await _context.Users
                .FirstOrDefaultAsync(u => u.CustomId == targetUserId);

            if (targetUser == null)
                return (false, "用户不存在", null);

            // 查找邀请人用户
            var inviterUser = await _context.Users
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == link.CreatedByUserId);

            if (inviterUser == null)
                return (false, "邀请人用户不存在", null);

            // 标记链接为已使用
            link.IsUsed = true;
            link.UsedAt = DateTime.UtcNow;
            link.UsedByUserId = targetUserId;

            // 添加成员并记录邀请人
            var newMember = new GroupChatMember(targetUser)
            {
                Type = Models.Enums.EGroupMemberType.Member,
                Nickname = targetUser.DisplayName ?? targetUser.CustomId,
                InvitedById = inviterUser.LocalId,
                InvitedBy = inviterUser
            };

            groupChat.Members.Add(newMember);

            // 为成员创建Contact对象
            var contact = new Contact(targetUser, groupChat)
            {
                DisplayName = groupChat.Settings.DisplayName
            };

            _context.Contacts.Add(contact);

            // 发送加入通知，明确指定邀请人
            await SendMemberJoinedMessageAsync(groupChat.UniqueMark, 
                link.CreatedByUserId, targetUserId);

            await _context.SaveChangesAsync();
            return (true, "加入群聊成功", groupChat);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "通过邀请链接加入群聊失败");
            return (false, "加入群聊失败", null);
        }
    }

    /// <summary>
    /// 获取群聊的有效邀请链接
    /// </summary>
    public async Task<List<GroupInviteLink>> GetValidInviteLinksAsync(string groupId, string operatorUserId)
    {
        try
        {
            // 验证权限
            var groupChat = await _context.GroupChats
                .Include(gc => gc.Members)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == groupId);

            if (groupChat == null)
                return new List<GroupInviteLink>();

            var operatorMember = groupChat.Members.FirstOrDefault(m => 
                m.TheGuyId.ToString() == operatorUserId);

            if (operatorMember == null || 
                (operatorMember.Type != Models.Enums.EGroupMemberType.Owner && 
                 operatorMember.Type != Models.Enums.EGroupMemberType.Admin))
                return new List<GroupInviteLink>();

            // 获取有效的邀请链接
            return await _context.GroupInviteLinks
                .Where(l => l.GroupId == groupId && 
                           !l.IsUsed && 
                           l.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取邀请链接失败");
            return new List<GroupInviteLink>();
        }
    }

    /// <summary>
    /// 撤销邀请链接
    /// </summary>
    public async Task<(bool success, string message)> RevokeInviteLinkAsync(
        string operatorUserId, string inviteCode)
    {
        try
        {
            var link = await _context.GroupInviteLinks
                .Include(l => l.Group)
                .ThenInclude(g => g.Members)
                .FirstOrDefaultAsync(l => l.InviteCode == inviteCode);

            if (link == null)
                return (false, "邀请链接不存在");

            // 验证权限
            var operatorMember = link.Group.Members.FirstOrDefault(m => 
                m.TheGuyId.ToString() == operatorUserId);

            if (operatorMember == null || 
                (operatorMember.Type != Models.Enums.EGroupMemberType.Owner && 
                 operatorMember.Type != Models.Enums.EGroupMemberType.Admin))
                return (false, "没有权限撤销此链接");

            // 标记为已使用（撤销）
            link.IsUsed = true;
            link.UsedAt = DateTime.UtcNow;
            link.UsedByUserId = operatorUserId;

            await _context.SaveChangesAsync();
            return (true, "撤销邀请链接成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "撤销邀请链接失败");
            return (false, "撤销邀请链接失败");
        }
    }

    /// <summary>
    /// 生成随机邀请码
    /// </summary>
    private string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 8)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    /// <summary>
    /// 发送成员加入通知
    /// </summary>
    private async Task SendMemberJoinedMessageAsync(string groupId, string operatorId, string targetId)
    {
        // 查找邀请人信息
        var inviterUser = await _context.Users
            .FirstOrDefaultAsync(u => u.LocalId.ToString() == operatorId);
        
        var inviterName = inviterUser?.DisplayName ?? inviterUser?.CustomId ?? "未知用户";

        var message = new Message
        {
            TraceId = Guid.NewGuid().ToString(),
            SenderId = Guid.Parse(operatorId),
            OfChatId = groupId,
            Content = $"用户 {targetId} 通过 {inviterName} 的邀请链接加入群聊",
            Type = Models.Enums.EMessageType.Event,
            SentTimestamp = DateTime.UtcNow.ToFileTimeUtc()
        };

        _context.Messages.Add(message);
    }
}
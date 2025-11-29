using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;

namespace ZenChattyServer.Net.Services;

public class GroupManageService(UserRelatedContext context, ILogger<GroupManageService> logger, ChatHubService chatHubService)
{
    /// <summary>
    /// 设置/取消管理员
    /// </summary>
    public async Task<(bool success, string message)> SetAdminAsync(
        string operatorUserId, GroupManagementRequest request, bool isAdmin)
    {
        try
        {
            var (groupChat, operatorMember, targetMember) = await ValidateGroupOperationAsync(
                operatorUserId, request.GroupId, request.TargetUserId, true);

            if (groupChat == null || operatorMember == null || targetMember == null)
                return (false, "操作验证失败");

            // 只有群主可以设置管理员
            if (operatorMember.Type != EGroupMemberType.Owner)
                return (false, "只有群主可以设置管理员");

            targetMember.Type = isAdmin ? EGroupMemberType.Admin : EGroupMemberType.Member;

            // 发送管理员变更通知
            await SendAdminChangeMessageAsync(request.GroupId, operatorUserId,
                request.TargetUserId, isAdmin, request.Reason);

            await context.SaveChangesAsync();
            return (true, isAdmin ? "设置管理员成功" : "取消管理员成功");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "设置管理员失败");
            return (false, "设置管理员失败");
        }
    }

    /// <summary>
    /// 禁言/取消禁言成员
    /// </summary>
    public async Task<(bool success, string message)> SetMemberSilentAsync(
        string operatorUserId, GroupManagementRequest request, bool isSilent)
    {
        try
        {
            var (groupChat, operatorMember, targetMember) = await ValidateGroupOperationAsync(
                operatorUserId, request.GroupId, request.TargetUserId, false);

            if (groupChat == null || operatorMember == null || targetMember == null)
                return (false, "操作验证失败");

            // 检查操作权限
            if (!AuthHelper.CanOperateMember(operatorMember, targetMember))
                return (false, "没有权限管理该成员");

            targetMember.IsSilent = isSilent;
            targetMember.SilentUntil =
                isSilent ? DateTime.UtcNow.Add(request.SilentDuration ?? TimeSpan.FromHours(1)) : null;

            // 发送禁言通知
            await SendSilentMessageAsync(request.GroupId, operatorUserId,
                request.TargetUserId, isSilent, request.SilentDuration, request.Reason);

            await context.SaveChangesAsync();
            return (true, isSilent ? "禁言成功" : "取消禁言成功");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "禁言操作失败");
            return (false, "禁言操作失败");
        }
    }

    /// <summary>
    /// 开关全体禁言
    /// </summary>
    public async Task<(bool success, string message)> ToggleGroupSilentAsync(
        string operatorUserId, string groupId, bool isSilent, string? reason = null)
    {
        try
        {
            var groupChat = await context.GroupChats
                .Include(gc => gc.Members)
                .Include(groupChat => groupChat.Settings)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == groupId);

            if (groupChat == null)
                return (false, "群聊不存在");

            var operatorMember = groupChat.Members.FirstOrDefault(m =>
                m.TheGuyId.ToString() == operatorUserId);

            if (operatorMember == null)
                return (false, "不是群成员");

            // 检查权限（群主或管理员）
            if (!AuthHelper.CanManageGroup(operatorMember))
                return (false, "没有权限设置全体禁言");

            groupChat.Settings.IsAllSilent = isSilent;

            // 发送全体禁言通知
            await SendGroupSilentMessageAsync(groupId, operatorUserId, isSilent, reason);

            await context.SaveChangesAsync();
            return (true, isSilent ? "开启全体禁言" : "关闭全体禁言");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "设置全体禁言失败");
            return (false, "设置全体禁言失败");
        }
    }

    /// <summary>
    /// 移除群成员
    /// </summary>
    /// <summary>
    /// 邀请成员加入群聊
    /// </summary>
    public async Task<(bool success, string message)> InviteMemberAsync(
        string operatorUserId, GroupManagementRequest request)
    {
        try
        {
            var groupChat = await context.GroupChats
                .Include(gc => gc.Members)
                .Include(groupChat => groupChat.Settings)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == request.GroupId);

            if (groupChat == null)
                return (false, "群聊不存在");

            var operatorMember = groupChat.Members.FirstOrDefault(m =>
                m.TheGuyId.ToString() == operatorUserId);

            if (operatorMember == null)
                return (false, "不是群成员");

            // 检查权限（群主或管理员）
            if (!AuthHelper.CanManageGroup(operatorMember))
                return (false, "没有权限邀请成员");

            // 查找目标用户
            var targetUser = await context.Users
                .FirstOrDefaultAsync(u => u.CustomId == request.TargetUserId);

            if (targetUser == null)
                return (false, "目标用户不存在");

            // 检查是否已经是成员
            if (groupChat.Members.Any(m => m.TheGuyId == targetUser.LocalId))
                return (false, "用户已是群成员");

            // 查找邀请人用户
            var inviterUser = await context.Users
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == operatorUserId);

            if (inviterUser == null)
                return (false, "邀请人用户不存在");

            // 检查两人是否为好友关系
            if (!RelationshipHelper.IsUserAFriend(context, inviterUser, targetUser))
                return (false, "只能邀请好友加入群聊");

            // 创建单次有效、48小时有效期的邀请链接
            var inviteLink = new GroupInviteLink
            {
                Id = Guid.NewGuid(),
                GroupId = groupChat.UniqueMark,
                CreatedByUserId = inviterUser.LocalId.ToString(),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(48),
                TargetUserId = targetUser.LocalId.ToString(),
                IsUsed = false,
                InviteCode = GenerateInviteCode()
            };

            context.GroupInviteLinks.Add(inviteLink);

            // 创建邀请链接消息
            var message = new Message
            {
                TraceId = Guid.NewGuid().ToString(),
                SenderId = inviterUser.LocalId,
                OfChatId = groupChat.UniqueMark,
                Content = $"邀请链接：{inviteLink.InviteCode} (有效期48小时，单次有效)",
                Type = EMessageType.Requesting,
                SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            // 通过ChatHub发送邀请链接消息
            await ChatAgent.Say(context, message, chatHubService);

            await context.SaveChangesAsync();
            return (true, "邀请链接已发送");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "邀请成员失败");
            return (false, "邀请成员失败");
        }
    }

    /// <summary>
    /// 生成邀请码
    /// </summary>
    private string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 8)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    /// <summary>
    /// 设置成员昵称
    /// </summary>
    public async Task<(bool success, string message)> SetMemberNicknameAsync(
        string operatorUserId, GroupManagementRequest request)
    {
        try
        {
            var (groupChat, operatorMember, targetMember) = await ValidateGroupOperationAsync(
                operatorUserId, request.GroupId, request.TargetUserId, false);

            if (groupChat == null || operatorMember == null || targetMember == null)
                return (false, "操作验证失败");

            // 检查权限（只能设置自己的昵称，或者管理员/群主可以设置他人昵称）
            if (operatorUserId != request.TargetUserId &&
                !AuthHelper.CanOperateMember(operatorMember, targetMember))
                return (false, "没有权限设置该成员昵称");

            targetMember.Nickname = request.NewTitle ?? string.Empty;

            await context.SaveChangesAsync();
            return (true, "设置昵称成功");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "设置昵称失败");
            return (false, "设置昵称失败");
        }
    }

    /// <summary>
    /// 设置成员title（仅群主可操作）
    /// </summary>
    public async Task<(bool success, string message)> SetMemberTitleAsync(
        string operatorUserId, GroupManagementRequest request)
    {
        try
        {
            var (groupChat, operatorMember, targetMember) = await ValidateGroupOperationAsync(
                operatorUserId, request.GroupId, request.TargetUserId, true);

            if (groupChat == null || operatorMember == null || targetMember == null)
                return (false, "操作验证失败");

            // 检查权限：只有群主可以设置成员title
            if (operatorMember.Type != EGroupMemberType.Owner)
                return (false, "只有群主可以设置成员title");

            // 设置成员title
            targetMember.GivenTitle = request.NewTitle;

            // 发送title设置通知
            await SendMemberTitleSetMessageAsync(request.GroupId, operatorUserId,
                request.TargetUserId, request.NewTitle, request.Reason);

            await context.SaveChangesAsync();
            return (true, "设置成员title成功");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "设置成员title失败");
            return (false, "设置成员title失败");
        }
    }

    /// <summary>
    /// 统一成员离开群聊方法（支持自愿退出和管理员移除）
    /// </summary>
    public async Task<(bool success, string message)> LeaveGroupAsync(
        string operatorUserId, string groupId, string? targetUserId = null)
    {
        try
        {
            var groupChat = await context.GroupChats
                .Include(gc => gc.Members)
                .Include(gc => gc.Settings)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == groupId);

            if (groupChat == null)
                return (false, "群聊不存在");

            // 确定目标用户ID（如果未指定，则使用操作者ID）
            var actualTargetUserId = targetUserId ?? operatorUserId;

            if (groupChat.InitById.ToString() == actualTargetUserId) return (false, "Owner cannot exit");

            // 查找操作者和目标成员
            var operatorMember = groupChat.Members.FirstOrDefault(m =>
                m.TheGuyId.ToString() == operatorUserId);
            var targetMember = groupChat.Members.FirstOrDefault(m =>
                m.TheGuyId.ToString() == actualTargetUserId);

            if (operatorMember == null || targetMember == null)
                return (false, "操作者或目标用户不是群成员");

            // 判断是自愿退出还是管理员移除
            bool isVoluntaryLeave = operatorUserId == actualTargetUserId;

            if (!AuthHelper.CanOperateMember(operatorMember, targetMember))
                return (false, "没有权限移除该成员");

            // 获取邀请人信息（仅用于自愿退出）
            var inviterId = isVoluntaryLeave ? targetMember.InvitedById : null;

            // 移除成员
            groupChat.Members = groupChat.Members.Where(m => m.Id != targetMember.Id).ToList();

            // 删除对应的Contact对象 todo this may cause problem !!!
            var contact = await context.Contacts
                .FirstOrDefaultAsync(c => c.HostId.ToString() == actualTargetUserId && c.ObjectId == groupId);
            if (contact != null)
            {
                contact.IsBlocked = true;
                contact.LastUsed = DateTime.UtcNow.AddYears(-1);
                context.Contacts.Update(contact);
            }
            
            // 发送相应的通知
            await SendGroupLeaveNotificationAsync(groupChat, targetMember, inviterId);

            await context.SaveChangesAsync();
            return (true, isVoluntaryLeave ? "退出群聊成功" : "移除成员成功");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "成员离开群聊失败");
            return (false, "成员离开群聊失败");
        }
    }

    /// <summary>
    /// 验证群操作权限
    /// </summary>
    private async Task<(GroupChat? groupChat, GroupChatMember? operatorMember, GroupChatMember? targetMember)>
        ValidateGroupOperationAsync(string operatorUserId, string groupId, string targetUserId, bool requireTarget)
    {
        var groupChat = await context.GroupChats
            .Include(gc => gc.Members)
            .ThenInclude(groupChatMember => groupChatMember.TheGuy)
            .FirstOrDefaultAsync(gc => gc.UniqueMark == groupId);

        if (groupChat == null)
            return (null, null, null);

        var operatorMember = groupChat.Members.FirstOrDefault(m =>
            m.TheGuyId.ToString() == operatorUserId);

        if (operatorMember == null)
            return (null, null, null);

        GroupChatMember? targetMember = null;
        if (!requireTarget) return (groupChat, operatorMember, targetMember);

        targetMember = groupChat.Members.FirstOrDefault(m =>
            m.TheGuy.CustomId == targetUserId);

        if (targetMember == null)
            return (null, null, null);


        return (groupChat, operatorMember, targetMember);
    }

    // 发送各种事件消息的方法
    private async Task SendAdminChangeMessageAsync(string groupId, string operatorId,
        string targetId, bool isAdmin, string? reason)
    {
        var message = new Message
        {
            TraceId = Guid.NewGuid().ToString(),
            SenderId = Guid.Parse(operatorId),
            OfChatId = groupId,
            Content = isAdmin ? $"用户 {targetId} 被设置为管理员" : $"用户 {targetId} 被取消管理员",
            Type = EMessageType.Event,
            SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        await ChatAgent.Say(context, message, chatHubService);
    }

    private async Task SendSilentMessageAsync(string groupId, string operatorId,
        string targetId, bool isSilent, TimeSpan? duration, string? reason)
    {
        var durationText = duration.HasValue ? $"，时长：{duration.Value.TotalMinutes}分钟" : "";
        var message = new Message
        {
            TraceId = Guid.NewGuid().ToString(),
            SenderId = Guid.Parse(operatorId),
            OfChatId = groupId,
            Content =
                $"用户 {targetId} 被{(isSilent ? "禁言" : "取消禁言")}{durationText}{(reason != null ? $"，原因：{reason}" : "")}",
            Type = EMessageType.Event,
            SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        await ChatAgent.Say(context, message, chatHubService);
    }

    public async Task SendGroupSilentMessageAsync(string groupId, string operatorId,
        bool isSilent, string? reason)
    {
        var message = new Message
        {
            TraceId = Guid.NewGuid().ToString(),
            SenderId = Guid.Parse(operatorId),
            OfChatId = groupId,
            Content = $"{(isSilent ? "开启" : "关闭")}全体禁言{(reason != null ? $"，原因：{reason}" : "")}",
            Type = EMessageType.Event,
            SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        await ChatAgent.Say(context, message, chatHubService);
    }

    private async Task SendMemberInvitedMessageAsync(string groupId, string operatorId,
        string targetId, string? reason)
    {
        // 查找邀请人信息
        var inviterUser = await context.Users
            .FirstOrDefaultAsync(u => u.LocalId.ToString() == operatorId);

        var inviterName = inviterUser?.DisplayName ?? inviterUser?.CustomId ?? "未知用户";

        var message = new Message
        {
            TraceId = Guid.NewGuid().ToString(),
            SenderId = Guid.Parse(operatorId),
            OfChatId = groupId,
            Content = $"用户 {targetId} 被 {inviterName} 邀请加入群聊{(reason != null ? $"，原因：{reason}" : "")}",
            Type = EMessageType.Event,
            SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        await ChatAgent.Say(context, message, chatHubService);
    }

    private async Task SendMemberTitleSetMessageAsync(string groupId, string operatorId,
        string targetId, string? title, string? reason)
    {
        var titleText = string.IsNullOrEmpty(title) ? "取消title" : $"设置为：{title}";
        var message = new Message
        {
            TraceId = Guid.NewGuid().ToString(),
            SenderId = Guid.Parse(operatorId),
            OfChatId = groupId,
            Content = $"用户 {targetId} 的title被{titleText}{(reason != null ? $"，原因：{reason}" : "")}",
            Type = EMessageType.Event,
            SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };
        await ChatAgent.Say(context, message, chatHubService);
    }

    /// <summary>
    /// 获取群聊信息
    /// </summary>
    public async Task<GroupChat?> GetGroupChatAsync(string groupId)
    {
        return await context.GroupChats
            .Include(gc => gc.Members)
            .Include(gc => gc.Settings)
            .FirstOrDefaultAsync(gc => gc.UniqueMark == groupId);
    }

    /// <summary>
    /// 添加消息到数据库
    /// </summary>
    public async Task AddMessageAsync(Message message)
    {
        // await chatHub.SendMessageAsUserAsync(message); // they said better using function Say
        await ChatAgent.Say(context, message, chatHubService); 
        
    }

    /// <summary>
    /// 保存数据库变更
    /// </summary>
    public async Task SaveChangesAsync()
    {
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// 向邀请人和群主发送群聊退出通知
    /// </summary>
    private async Task SendGroupLeaveNotificationAsync(GroupChat groupChat, GroupChatMember leavingMember,
        Guid? inviterId)
    {
        try
        {
            var leavingUser = await context.Users
                .FirstOrDefaultAsync(u => u.LocalId == leavingMember.TheGuyId);

            if (leavingUser == null) return;

            var leavingUserName = leavingUser.DisplayName;
            var groupName = groupChat.Settings.DisplayName;

            // 获取群主
            var ownerMember = groupChat.Members.FirstOrDefault(m => m.Type == EGroupMemberType.Owner);
            if (ownerMember == null) return;

            var recipients = new List<Guid> { ownerMember.TheGuyId };

            // 如果邀请人存在且不是群主，则添加到通知列表
            if (inviterId.HasValue && inviterId.Value != ownerMember.TheGuyId)
            {
                recipients.Add(inviterId.Value);
            }

            // 去重
            recipients = recipients.Distinct().ToList();

            foreach (var recipientId in recipients)
            {
                await SendGroupLeaveMessageAsync(recipientId, leavingUserName, groupName, groupChat.UniqueMark);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "发送群聊退出通知失败");
        }
    }

    /// <summary>
    /// 向指定用户发送群聊退出消息
    /// </summary>
    private async Task SendGroupLeaveMessageAsync(Guid recipientId, string leavingUserName, string groupName,
        string groupChatId)
    {
        try
        {
            // 检查接收者是否在退群者的contact中
            var existingContact = await context.Contacts
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c =>
                    c.HostId == recipientId &&
                    c.Object is PrivateChat &&
                    (((PrivateChat)c.Object).ReceiverId.ToString() == recipientId.ToString() ||
                     ((PrivateChat)c.Object).InitById.ToString() == recipientId.ToString()));

            if (existingContact != null)
            {
                // 如果存在contact关系，通过私聊发送通知
                var message = new Message
                {
                    TraceId = Guid.NewGuid().ToString(),
                    SenderId = recipientId, // 使用接收者ID作为发送者，表示系统通知
                    OfChatId = existingContact.ObjectId, // 使用私聊ID
                    Content = $"{leavingUserName} 已退出群聊 {groupName}",
                    Type = EMessageType.Event,
                    SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                };

                await ChatAgent.Say(context, message, chatHubService);
            }
            else
            {
                // 检查群设置是否允许通过群聊创建私聊
                var groupChat = await context.GroupChats
                    .Include(gc => gc.Settings)
                    .FirstOrDefaultAsync(gc => gc.UniqueMark == groupChatId);

                if (groupChat?.Settings?.IsPrivateChatAllowed == true)
                {
                    // 创建informal私聊并发送通知
                    var leavingUser = await context.Users
                        .FirstOrDefaultAsync(u => u.DisplayName == leavingUserName || u.CustomId == leavingUserName);

                    if (leavingUser != null)
                    {
                        var recipientUser = await context.Users.FindAsync(recipientId);

                        if (recipientUser != null)
                        {
                            // 创建informal私聊
                            var privateChat = new PrivateChat(recipientUser, leavingUser)
                            {
                                IsInformal = true
                            };

                            context.PrivateChats.Add(privateChat);

                            // 为双方创建Contact对象
                            var contact1 = new Contact(recipientUser, privateChat)
                            {
                                DisplayName = leavingUser.DisplayName ?? leavingUser.CustomId
                            };

                            var contact2 = new Contact(leavingUser, privateChat)
                            {
                                DisplayName = recipientUser.DisplayName ?? recipientUser.CustomId
                            };

                            context.Contacts.AddRange(contact1, contact2);

                            // 发送通知消息
                            var message = new Message
                            {
                                TraceId = Guid.NewGuid().ToString(),
                                SenderId = recipientId,
                                OfChatId = privateChat.UniqueMark,
                                Content = $"用户 {leavingUserName} 已退出群聊 {groupName}",
                                Type = EMessageType.Event,
                                SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                            };

                            await ChatAgent.Say(context, message, chatHubService);
                        }
                    }
                }
                else
                {
                    // 直接在群聊中发送系统通知消息 todo !!! better do nothing... just leave...
                    var message = new Message
                    {
                        TraceId = Guid.NewGuid().ToString(),
                        SenderId = recipientId, 
                        OfChatId = groupChatId, 
                        Content = $"用户 {leavingUserName} 已退出群聊 {groupName}",
                        Type = EMessageType.Event,
                        SentTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    };

                    await ChatAgent.Say(context, message, chatHubService);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "发送群聊退出消息失败");
        }
    }
}
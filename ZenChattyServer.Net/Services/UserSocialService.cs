using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Request;
using ZenChattyServer.Net.Models.Response;

namespace ZenChattyServer.Net.Services;

public class UserSocialService
{
    private readonly UserRelatedContext _context;
    private readonly ILogger<UserSocialService> _logger;

    public UserSocialService(UserRelatedContext context, ILogger<UserSocialService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 创建私聊会话
    /// </summary>
    public async Task<(bool success, string chatId, string message)> CreatePrivateChatAsync(
        string initiatorUserId, CreatePrivateChatRequest request)
    {
        try
        {
            // 查找接收者
            var receiver = await _context.Users
                .FirstOrDefaultAsync(u => u.CustomId == request.ReceiverCustomId);
                
            if (receiver == null)
                return (false, "", "User does not exist");

            // 检查是否已经是好友（已有Contact关系）
            var existingContact = await _context.Contacts
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => 
                    c.HostId.ToString() == initiatorUserId && 
                    c.Object is PrivateChat && 
                    ((PrivateChat)c.Object).InitById.ToString() == receiver.LocalId.ToString() || 
                    ((PrivateChat)c.Object).ReceiverId.ToString() == receiver.LocalId.ToString());

            if (existingContact != null)
                return (true, existingContact.ObjectId, "Private chat already exists");

            // 创建私聊会话
            var initiator = await _context.Users.FindAsync(Guid.Parse(initiatorUserId));
            if (initiator == null)
                return (false, "", "Initiator user does not exist");

            var privateChat = new PrivateChat(initiator, receiver)
            {
                IsInformal = request.IsInformal
            };

            _context.PrivateChats.Add(privateChat);

            // 为双方创建Contact对象
            var contact1 = new Contact(initiator, privateChat)
            {
                DisplayName = request.DisplayName ?? receiver.DisplayName ?? receiver.CustomId
            };

            var contact2 = new Contact(receiver, privateChat)
            {
                DisplayName = initiator.DisplayName ?? initiator.CustomId
            };

            _context.Contacts.AddRange(contact1, contact2);

            await _context.SaveChangesAsync();

            // 发送自动打招呼消息
            await SendGreetingMessageAsync(privateChat.UniqueMark, initiatorUserId);

            return (true, privateChat.UniqueMark, "Private chat created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建私聊失败");
            return (false, "", "Failed to create private chat");
        }
    }

    /// <summary>
    /// 查询用户信息（根据隐私设置过滤）
    /// </summary>
    public async Task<UserInfoResponse> QueryUserInfoAsync(string requesterUserId, string email, string? customId)
    {
        try
        {
            var requester = await _context.Users
                .Include(u => u.Privacies)
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == requesterUserId);
            
            if (requester == null)
                return new UserInfoResponse { success = false, message = "请求用户不存在" };

            // 查找目标用户
            var targetUser = await _context.Users
                .Include(u => u.Privacies)
                .FirstOrDefaultAsync(u => u.Email == email || u.CustomId == customId);
            
            if (targetUser == null)
                return new UserInfoResponse { success = false, message = "目标用户不存在" };

            // 检查是否允许通过搜索发现
            if (!targetUser.Privacies.IsDiscoverableViaSearch)
                return new UserInfoResponse { success = false, message = "该用户不允许被搜索" };

            // 检查关系以确定可见性
            var isFriend = RelationshipHelper.IsUserAFriend(_context, requester,  targetUser);
            var isInSameGroup = await IsInSameGroupAsync(requester.LocalId.ToString(), targetUser.LocalId.ToString());

            // 根据隐私设置过滤用户信息
            var filteredUserInfo = FilterUserInfoByPrivacy(targetUser, isFriend, isInSameGroup);
            
            return filteredUserInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "查询用户信息失败");
            return new UserInfoResponse { success = false, message = "查询用户信息失败" };
        }
    }

    /// <summary>
    /// 根据隐私设置过滤用户信息
    /// </summary>
    private UserInfoResponse FilterUserInfoByPrivacy(User targetUser, bool isFriend, bool isInSameGroup)
    {
        var response = new UserInfoResponse
        {
            LocalId = targetUser.LocalId,
            success = true,
            message = "查询成功"
        };

        // 基本信息（总是可见）
        response.DisplayName = targetUser.DisplayName;
        response.AvatarFileLocator = targetUser.AvatarFileLocator;
        response.BackgroundFileLocator = targetUser.BackgroundFileLocator;
        response.CustomId = targetUser.CustomId;
        response.Status = targetUser.Status;
        response.RegisteredAt = targetUser.RegisteredAt;

        // 根据隐私设置过滤敏感信息
        var privacy = targetUser.Privacies;

        // 邮箱可见性检查
        if (privacy.ContactVisibility == EPrivacyVisibilityRange.Everyone ||
            (privacy.ContactVisibility == EPrivacyVisibilityRange.FriendsAndGroups && (isFriend || isInSameGroup)) ||
            (privacy.ContactVisibility == EPrivacyVisibilityRange.Friends && isFriend))
        {
            response.Email = targetUser.Email;
            response.PhoneNumber = targetUser.PhoneNumber;
        }

        // 个人简介可见性检查
        if (privacy.BioVisibility == EPrivacyVisibilityRange.Everyone ||
            (privacy.BioVisibility == EPrivacyVisibilityRange.FriendsAndGroups && (isFriend || isInSameGroup)) ||
            (privacy.BioVisibility == EPrivacyVisibilityRange.Friends && isFriend))
        {
            response.Bio = targetUser.Bio;
        }

        // 性别可见性检查
        if (privacy.GenderVisibility == EPrivacyVisibilityRange.Everyone ||
            (privacy.GenderVisibility == EPrivacyVisibilityRange.FriendsAndGroups && (isFriend || isInSameGroup)) ||
            (privacy.GenderVisibility == EPrivacyVisibilityRange.Friends && isFriend))
        {
            response.Gender = targetUser.Gender;
            response.Birth = targetUser.Birth;
        }

        return response;
    }

    /// <summary>
    /// 检查两个用户是否在同一个群组中
    /// </summary>
    private async Task<bool> IsInSameGroupAsync(string user1Id, string user2Id)
    {
        var user1Groups = await _context.GroupChatMembers
            .Where(gm => gm.TheGuy.LocalId.ToString() == user1Id)
            .Select(gm => gm.GroupChatId)
            .ToListAsync();

        var user2Groups = await _context.GroupChatMembers
            .Where(gm => gm.TheGuy.LocalId.ToString() == user2Id)
            .Select(gm => gm.GroupChatId)
            .ToListAsync();

        return user1Groups.Intersect(user2Groups).Any();
    }

    /// <summary>
    /// 创建群聊
    /// </summary>
    public async Task<(bool success, string groupId, string message)> CreateGroupChatAsync(
        string creatorUserId, CreateGroupChatRequest request)
    {
        try
        {
            var creator = await _context.Users.FindAsync(Guid.Parse(creatorUserId));
            if (creator == null)
                return (false, "", "Creator user does not exist");

            // 创建群聊
            var groupChat = new GroupChat(creator)
            {
                Settings = new GroupSettings
                {
                    DisplayName = request.GroupName,
                    AvatarFileLocator = request.AvatarUrl
                }
            };

            // 添加创建者为群主
            var creatorMember = new GroupChatMember(creator)
            {
                Type = EGroupMemberType.Owner,
                Nickname = creator.DisplayName ?? creator.CustomId
            };

            groupChat.Members = new List<GroupChatMember> { creatorMember };

            _context.GroupChats.Add(groupChat);

            // 为创建者创建Contact对象
            var contact = new Contact(creator, groupChat)
            {
                DisplayName = request.GroupName
            };

            _context.Contacts.Add(contact);

            await _context.SaveChangesAsync();

            // 发送群创建通知消息
            await SendGroupCreationMessageAsync(groupChat.UniqueMark, creatorUserId);

            return (true, groupChat.UniqueMark, "Group chat created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建群聊失败");
            return (false, "", "Failed to create group chat");
        }
    }

    /// <summary>
    /// 禁用群聊
    /// </summary>
    public async Task<(bool success, string message)> DisableGroupChatAsync(
        string operatorUserId, string groupId)
    {
        try
        {
            var groupChat = await _context.GroupChats
                .Include(gc => gc.Members)
                .FirstOrDefaultAsync(gc => gc.UniqueMark == groupId);

            if (groupChat == null)
                return (false, "Group chat does not exist");

            // 检查操作者是否为群主
            var operatorMember = groupChat.Members.FirstOrDefault(m => 
                m.TheGuyId.ToString() == operatorUserId && 
                m.Type == EGroupMemberType.Owner);

            if (operatorMember == null)
                return (false, "Only group owner can disable group chat");

            groupChat.Status = EChatStatus.GroupDisabled;

            // 发送群禁用通知消息
            await SendGroupDisabledMessageAsync(groupId, operatorUserId);

            await _context.SaveChangesAsync();
            return (true, "Group chat disabled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "禁用群聊失败");
            return (false, "Failed to disable group chat");
        }
    }

    /// <summary>
    /// 更新Contact未读消息计数
    /// </summary>
    public async Task<(bool success, string message)> UpdateUnreadCountAsync(string contactId, ushort unreadCount, User user)
    {
        try
        {
            var contact = await _context.Contacts.FindAsync(Guid.Parse(contactId));
            if (contact == null || contact.HostId != user.LocalId) return (false, "Contact does not exist");
            
            contact.LastUnreadCount = unreadCount;
            contact.LastUsed = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (true, "Unread count updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "failed to update unread count");
            return (false, "Failed to update unread count");
        }
    }

    /// <summary>
    /// 检查用户隐私设置是否允许接收好友请求或群聊邀请
    /// </summary>
    public async Task<(bool allowed, string message)> CheckPrivacySettingsForRequestAsync(
        string targetUserId, string requesterUserId, bool isGroupInvite = false)
    {
        try
        {
            var targetUser = await _context.Users
                .Include(u => u.Privacies)
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == targetUserId);

            var requester = await _context.Users
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == requesterUserId);
                
            if (requester == null || targetUser == null)
                return (false, "Requester or Target user does not exist");

            // 检查是否被拉黑
            var isBlocked = await CheckBlockStatusAsync(targetUserId, requesterUserId);
            if (isBlocked)
            {
                Console.WriteLine("blocked");
                return (false, "You have been blocked by the other party, cannot send request");
            }

            // 检查隐私设置
            var privacy = targetUser.Privacies;
            
            if (isGroupInvite)
            {
                // 群聊邀请检查
                if (!privacy.IsInvitableToGroup)
                    return (false, "The other party does not allow being invited to group chats");
            }
            else
            {
                // 好友请求检查
                if (!privacy.IsAddableFromGroup)
                {
                    Console.WriteLine("not allowed");
                    return (false, "The other party does not allow adding friends through group chats");
                }
            }

            return (true, "Request allowed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查隐私设置失败");
            return (false, "检查隐私设置失败");
        }
    }

    /// <summary>
    /// 检查两个用户之间的拉黑状态
    /// </summary>
    public async Task<bool> CheckBlockStatusAsync(string userId1, string userId2)
    {
        try
        {
            // 检查userId1是否拉黑了userId2
            var contact1 = await _context.Contacts
                .Include(c => c.Host)
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => 
                    c.Host.LocalId.ToString() == userId1 && 
                    c.Object is PrivateChat && 
                    (((PrivateChat)c.Object).InitBy.LocalId.ToString() == userId2 || ((PrivateChat)c.Object).Receiver.LocalId.ToString() == userId2) &&
                    c.IsBlocked);

            // 检查userId2是否拉黑了userId1
            var contact2 = await _context.Contacts
                .Include(c => c.Host)
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => 
                    c.Host.LocalId.ToString() == userId2 && 
                    c.Object is PrivateChat && 
                    (((PrivateChat)c.Object).InitBy.LocalId.ToString() == userId1 || ((PrivateChat)c.Object).Receiver.LocalId.ToString() == userId1) &&
                    c.IsBlocked);

            return contact1 != null || contact2 != null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check block status");
            return false;
        }
    }

    /// <summary>
    /// 添加好友
    /// </summary>
    public async Task<(bool success, string chatId, string message)> AddFriendAsync(
        string initiatorUserId, AddFriendRequest request)
    {
        try
        {
            // 查找目标用户 - 支持Guid格式(LocalId)和字符串格式(CustomId)
            User? targetUser = null;
            
            // 首先尝试按Guid格式查找
            if (Guid.TryParse(request.TargetUserId, out var targetUserId))
            {
                targetUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.LocalId == targetUserId);
            }

            if (targetUser == null)
            {
                Console.WriteLine("not exist xxx");
                return (false, "", "目标用户不存在");
            }

            // 检查是否已经是好友（非临时私聊）
            var existingPrivateChat = await _context.PrivateChats
                .Include(pc => pc.InitBy)
                .Include(pc => pc.Receiver)
                .FirstOrDefaultAsync(pc => 
                    ((pc.InitBy.LocalId.ToString() == initiatorUserId && pc.Receiver.LocalId.ToString() == targetUser.LocalId.ToString()) ||
                     (pc.InitBy.LocalId.ToString() == targetUser.LocalId.ToString() && pc.Receiver.LocalId.ToString() == initiatorUserId)) &&
                    !pc.IsInformal);

            if (existingPrivateChat != null)
                return (false, "", "已经是好友关系");

            // 检查隐私设置
            var privacyCheck = await CheckPrivacySettingsForRequestAsync(targetUser.LocalId.ToString(), initiatorUserId);
            if (!privacyCheck.allowed)
                return (false, "", privacyCheck.message);
            
            Console.WriteLine("stage 0");

            // 检查是否被拉黑
            var isBlocked = await CheckBlockStatusAsync(targetUser.LocalId.ToString(), initiatorUserId);
            
            if (isBlocked)
                return (false, "", "您已被对方拉黑，无法添加好友");
            
            Console.WriteLine("stage 1");

            // 查找发起者用户
            var initiator = await _context.Users.FindAsync(Guid.Parse(initiatorUserId));
            if (initiator == null)
                return (false, "", "发起者用户不存在");
            
            Console.WriteLine("stage 2");

            // 创建正式私聊（非临时）
            var privateChat = new PrivateChat(initiator, targetUser)
            {
                IsInformal = request.IsInformal
            };

            _context.PrivateChats.Add(privateChat);
            await _context.SaveChangesAsync(); // 

            // 为双方创建Contact对象
            var contact1 = new Contact(initiator, privateChat)
            {
                DisplayName = targetUser.DisplayName ?? targetUser.CustomId
            };

            var contact2 = new Contact(targetUser, privateChat)
            {
                DisplayName = initiator.DisplayName ?? initiator.CustomId
            };

            _context.Contacts.AddRange(contact1, contact2);

            await _context.SaveChangesAsync();

            // 发送自动打招呼消息
            await SendGreetingMessageAsync(privateChat.UniqueMark, initiatorUserId);

            return (true, privateChat.UniqueMark, "好友添加成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "添加好友失败");
            return (false, "", "添加好友失败");
        }
    }

    /// <summary>
    /// 解除拉黑状态并添加好友
    /// </summary>
    public async Task<(bool success, string message)> UnblockAndAddFriendAsync(
        string userId1, string userId2)
    {
        try
        {
            // 查找双方的Contact记录
            var contacts = await _context.Contacts
                .Include(c => c.Host)
                .Include(c => c.Object)
                .Where(c => 
                    (c.Host.LocalId.ToString() == userId1 || c.Host.LocalId.ToString() == userId2) &&
                    c.Object is PrivateChat && 
                    (((PrivateChat)c.Object).InitBy.LocalId.ToString() == userId1 || ((PrivateChat)c.Object).InitBy.LocalId.ToString() == userId2 ||
                     ((PrivateChat)c.Object).Receiver.LocalId.ToString() == userId1 || ((PrivateChat)c.Object).Receiver.LocalId.ToString() == userId2))
                .ToListAsync();

            // 解除拉黑状态
            foreach (var contact in contacts)
            {
                contact.IsBlocked = false;
            }

            // 检查是否已经是好友（非临时私聊）
            var existingPrivateChat = await _context.PrivateChats
                .Include(pc => pc.InitBy)
                .Include(pc => pc.Receiver)
                .FirstOrDefaultAsync(pc => 
                    ((pc.InitBy.LocalId.ToString() == userId1 && pc.Receiver.LocalId.ToString() == userId2) ||
                     (pc.InitBy.LocalId.ToString() == userId2 && pc.Receiver.LocalId.ToString() == userId1)) &&
                    !pc.IsInformal);

            if (existingPrivateChat == null)
            {
                // 创建正式私聊
                var user1 = await _context.Users.FindAsync(Guid.Parse(userId1));
                var user2 = await _context.Users.FindAsync(Guid.Parse(userId2));

                if (user1 == null || user2 == null)
                    return (false, "用户不存在");

                var privateChat = new PrivateChat(user1, user2)
                {
                    IsInformal = false
                };

                _context.PrivateChats.Add(privateChat);

                // 为双方创建Contact对象
                var contact1 = new Contact(user1, privateChat)
                {
                    DisplayName = user2.DisplayName ?? user2.CustomId
                };

                var contact2 = new Contact(user2, privateChat)
                {
                    DisplayName = user1.DisplayName ?? user1.CustomId
                };

                _context.Contacts.AddRange(contact1, contact2);
            }

            await _context.SaveChangesAsync();

            // 发送自动打招呼消息
            var user1Contacts = await _context.Contacts
                .Include(c => c.Object)
                .Where(c => c.Host.LocalId.ToString() == userId1 && 
                           c.Object is PrivateChat && 
                           (((PrivateChat)c.Object).InitBy.LocalId.ToString() == userId2 || ((PrivateChat)c.Object).Receiver.LocalId.ToString() == userId2))
                .FirstOrDefaultAsync();

            if (user1Contacts != null)
            {
                await SendGreetingMessageAsync(user1Contacts.ObjectId, userId1);
            }

            return (true, "Unblocked and added friend successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to unblock and add friend");
            return (false, "Failed to unblock and add friend");
        }
    }
    
    /// <summary>
    /// 解除拉黑并发送消息
    /// </summary>
    public async Task<(bool success, string message)> UnblockAndSendGreetingAsync(
        string userId, string targetUserId)
    {
        try
        {
            var contact = await _context.Contacts
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => 
                    c.HostId.ToString() == userId && 
                    c.Object is PrivateChat && 
                    (((PrivateChat)c.Object).InitById.ToString() == targetUserId || 
                     ((PrivateChat)c.Object).ReceiverId.ToString() == targetUserId));

            if (contact == null)
                return (false, "Contact does not exist");

            if (!contact.IsBlocked)
                return (false, "User is not blocked");

            // 解除拉黑
            contact.IsBlocked = false;

            // 发送打招呼消息
            await SendGreetingMessageAsync(contact.ObjectId, userId);

            await _context.SaveChangesAsync();
            return (true, "Unblocked and sent greeting message successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to unblock");
            return (false, "Failed to unblock");
        }
    }

    private async Task SendGreetingMessageAsync(string chatId, string senderId)
    {
        try
        {
            var greetingMessage = new Message
            {
                TraceId = Guid.NewGuid().ToString(),
                SenderId = Guid.Parse(senderId),
                OfChatId = chatId,
                Content = "We are already friends, let's start chatting now!",
                Type = EMessageType.Normal,
                SentTimestamp = DateTime.UtcNow.ToFileTimeUtc()
            };

            _context.Messages.Add(greetingMessage);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send greeting message");
        }
    }

    private async Task SendGroupCreationMessageAsync(string groupId, string creatorId)
    {
        try
        {
            var creationMessage = new Message
            {
                TraceId = Guid.NewGuid().ToString(),
                SenderId = Guid.Parse(creatorId),
                OfChatId = groupId,
                Content = "Group chat created successfully!",
                Type = EMessageType.Event,
                SentTimestamp = DateTime.UtcNow.ToFileTimeUtc()
            };

            _context.Messages.Add(creationMessage);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send group creation notification message");
        }
    }

    /// <summary>
    /// 获取用户联系人列表
    /// </summary>
    public async Task<List<Contact>> GetContactsAsync(string userId)
    {
        try
        {
            var contacts = await _context.Contacts
                .Include(c => c.Host)
                .Include(c => c.Object)
                .Where(c => c.Host.LocalId.ToString() == userId)
                .OrderByDescending(c => c.LastUsed)
                .ToListAsync();

            return contacts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get contact list");
            return new List<Contact>();
        }
    }

    private async Task SendGroupDisabledMessageAsync(string groupId, string operatorId)
    {
        try
        {
            var disabledMessage = new Message
            {
                TraceId = Guid.NewGuid().ToString(),
                SenderId = Guid.Parse(operatorId),
                OfChatId = groupId,
                Content = "Group chat has been disabled",
                Type = EMessageType.Event,
                SentTimestamp = DateTime.UtcNow.ToFileTimeUtc()
            };

            _context.Messages.Add(disabledMessage);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "发送群禁用通知消息失败");
        }
    }

    /// <summary>
    /// 拉黑用户
    /// </summary>
    public async Task<(bool success, string message)> BlockUserAsync(string userId, string targetUserId)
    {
        try
        {
            // 查找与目标用户的私聊Contact记录
            var contact = await _context.Contacts
                .Include(c => c.Object)
                .FirstOrDefaultAsync(c => 
                    c.HostId.ToString() == userId && 
                    c.Object is PrivateChat && 
                    (((PrivateChat)c.Object).InitById.ToString() == targetUserId || 
                     ((PrivateChat)c.Object).ReceiverId.ToString() == targetUserId));

            if (contact == null)
                return (false, "联系人不存在");

            // 设置拉黑状态
            contact.IsBlocked = true;
            await _context.SaveChangesAsync();

            return (true, "拉黑成功");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "拉黑用户失败");
            return (false, "拉黑用户失败");
        }
        }

    #region 隐私设置更新方法

    /// <summary>
    /// 更新用户隐私设置
    /// </summary>
    public async Task<BasicResponse> UpdatePrivacySettingsAsync(string userId, UpdatePrivacySettingsRequest request)
    {
        try
        {
            // 验证用户存在
            var user = await _context.Users
                .Include(u => u.Privacies)
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == userId);
            if (user == null)
            {
                return new BasicResponse { success = false, content = "用户不存在" };
            }

            // 更新隐私设置字段（仅更新非空值）
            if (request.IsDiscoverableViaSearch.HasValue)
                user.Privacies.IsDiscoverableViaSearch = request.IsDiscoverableViaSearch.Value != EPrivacyVisibilityRange.None;
            if (request.IsAddableFromGroup.HasValue)
                user.Privacies.IsAddableFromGroup = request.IsAddableFromGroup.Value != EPrivacyVisibilityRange.None;
            if (request.IsGroupInviteAllowed.HasValue)
                user.Privacies.IsInvitableToGroup = request.IsGroupInviteAllowed.Value != EPrivacyVisibilityRange.None;

            await _context.SaveChangesAsync();

            _logger.LogInformation("用户 {UserId} 更新了隐私设置", userId);
            return new BasicResponse { success = true, content = "隐私设置更新成功" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新用户 {UserId} 隐私设置时发生错误", userId);
            return new BasicResponse { success = false, content = "隐私设置更新失败" };
        }
    }

    /// <summary>
    /// 获取用户隐私设置
    /// </summary>
    public async Task<PrivacySettingsResponse> GetPrivacySettingsAsync(string userId)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Privacies)
                .FirstOrDefaultAsync(u => u.LocalId.ToString() == userId);
            if (user == null)
            {
                return new PrivacySettingsResponse { success = false, message = "用户不存在" };
            }

            var privacy = user.Privacies;
            return new PrivacySettingsResponse
            {
                success = true,
                message = "获取隐私设置成功",
                IsDiscoverableViaSearch = privacy.IsDiscoverableViaSearch ? EPrivacyVisibilityRange.Everyone : EPrivacyVisibilityRange.None,
                IsAddableFromGroup = privacy.IsAddableFromGroup ? EPrivacyVisibilityRange.Everyone : EPrivacyVisibilityRange.None,
                IsGroupInviteAllowed = privacy.IsInvitableToGroup ? EPrivacyVisibilityRange.Everyone : EPrivacyVisibilityRange.None
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取用户 {UserId} 隐私设置时发生错误", userId);
            return new PrivacySettingsResponse { success = false, message = "获取隐私设置失败" };
        }
    }

    #endregion
}
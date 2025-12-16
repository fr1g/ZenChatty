using Microsoft.EntityFrameworkCore;
using ZenChattyServer.Net.Helpers;
using ZenChattyServer.Net.Helpers.Context;
using ZenChattyServer.Net.Models;
using ZenChattyServer.Net.Models.Enums;
using ZenChattyServer.Net.Models.Response;

namespace ZenChattyServer.Net.Services;

/// <summary>
/// 消息验证服务
/// </summary>
public class MessageValidationService(UserRelatedContext context)
{
    public async Task<SendMessageResponse> ValidatePrivateChatMessageAsync(
        string chatUniqueMark,
        Guid senderId,
        string? viaGroupChatId = null)
    {
        Console.WriteLine($"[ValidatePrivateChat] 开始验证 - chatMark: {chatUniqueMark}, senderId: {senderId}");
        
        var chat = await context.Chats
            .Include(c => c.Contacts)
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
            
        if (chat == null)
        {
            Console.WriteLine($"[ValidatePrivateChat] 聊天不存在 - chatMark: {chatUniqueMark}");
            return SendMessageResponse.ChatNotFound();
        }
        
        Console.WriteLine($"[ValidatePrivateChat] 找到聊天 - Contacts数量: {chat.Contacts?.Count}");
        return await ValidatePrivateChatMessageAsync(chat, senderId, viaGroupChatId);
    }

    public async Task<SendMessageResponse> ValidatePrivateChatMessageAsync(
        Chat chat, 
        Guid senderId, 
        string? viaGroupChatId = null)
    {
        Console.WriteLine($"[ValidatePrivateChat-2] 进入详细验证 - chatMark: {chat.UniqueMark}, senderId: {senderId}");

        var sender = await context.Users.FindAsync(senderId);
        if (sender == null)
        {
            Console.WriteLine($"[ValidatePrivateChat-2] 发送者不存在 - senderId: {senderId}");
            return SendMessageResponse.SenderNotFound();
        }

        // 3. 检查聊天是否为私聊
        var privateChat = await context.PrivateChats
            // .Include(pc => pc.Receiver)
            .FirstOrDefaultAsync(pc => pc.UniqueMark == chat.UniqueMark);
            
        if (privateChat == null)
        {
            Console.WriteLine($"[ValidatePrivateChat-2] 非私聊类型 - chatMark: {chat.UniqueMark}");
            return SendMessageResponse.Unauthorized("非私聊类型");
        }

        Console.WriteLine($"[ValidatePrivateChat-2] 私聊详情 - InitById: {privateChat.InitById}, ReceiverId: {privateChat.ReceiverId}, IsInformal: {privateChat.IsInformal}");

        // 4. 检查发送者是否在聊天中
        var contactsInChat = chat.Contacts?.Select(c => c.HostId.ToString()).ToList() ?? new List<string>();
        Console.WriteLine($"[ValidatePrivateChat-2] 聊天中的联系人: [{string.Join(", ", contactsInChat)}]");
        
        if (chat.Contacts.All(c => c.HostId != senderId))
        {
            Console.WriteLine($"[ValidatePrivateChat-2] 发送者不在该私聊中 - senderId: {senderId}");
            return SendMessageResponse.Unauthorized("发送者不在该私聊中");
        }
        
        // if(privateChat.IsInformal && privateChat.Receiver.Privacies.IsDiscoverableViaSearch && )

        // 5. 检查接收者是否拉黑了发送者 - 修复：需要判断实际接收者是谁
        var actualReceiverId = privateChat.InitById == senderId ? privateChat.ReceiverId : privateChat.InitById;
        Console.WriteLine($"[ValidatePrivateChat-2] 实际接收者: {actualReceiverId}");
        
        var receiverContact = await context.Contacts
            .FirstOrDefaultAsync(c => c.HostId == actualReceiverId && c.ObjectId == senderId.ToString());
            
        if (receiverContact?.IsBlocked == true)
        {
            Console.WriteLine($"[ValidatePrivateChat-2] 被拉黑 - senderId: {senderId}, actualReceiverId: {actualReceiverId}");
            return SendMessageResponse.PrivateChatBlocked();
        }

        // 6. 如果通过群聊发起，验证群聊权限
        if (!string.IsNullOrEmpty(viaGroupChatId))
        {
            Console.WriteLine($"[ValidatePrivateChat-2] 通过群聊发起，验证群聊权限 - viaGroupChatId: {viaGroupChatId}");
            var groupValidationResult = await ValidateViaGroupChatAsync(viaGroupChatId, senderId, actualReceiverId);
            if (groupValidationResult.ResultCanBe != EMessageSendResult.Success)
                return groupValidationResult;
        }
        else
        {
            // 7. 非群聊发起的私聊，检查隐私设置和消息类型限制
            Console.WriteLine($"[ValidatePrivateChat-2] 非群聊发起，检查隐私设置");
            var privacyValidationResult = await ValidateNonGroupPrivateChatAsync(privateChat);
            Console.WriteLine($"[ValidatePrivateChat-2] 隐私设置验证结果: {privacyValidationResult.ResultCanBe}");
            if (privacyValidationResult.ResultCanBe != EMessageSendResult.Success)
                return privacyValidationResult;
        }

        Console.WriteLine($"[ValidatePrivateChat-2] 验证通过");
        return SendMessageResponse.Success(Guid.NewGuid());
    }
    
    private async Task<SendMessageResponse> ValidateViaGroupChatAsync(
        string groupChatId, 
        Guid senderId, 
        Guid receiverId)
    {
        var groupChat = await context.GroupChats
            .Include(gc => gc.Members)
            .Include(gc => gc.Settings)
            .FirstOrDefaultAsync(gc => gc.UniqueMark == groupChatId);
            
        if (groupChat == null)
            return SendMessageResponse.ViaGroupChatValidationFailed();

        if (groupChat.Status == EChatStatus.GroupDisabled)
            return SendMessageResponse.GroupChatDisabled();

        if (groupChat.Settings?.IsPrivateChatAllowed == false)
            return SendMessageResponse.PrivateChatNotAllowed();

        var senderInGroup = groupChat.Members.Any(m => m.TheGuyId == senderId);
        if (!senderInGroup)
            return SendMessageResponse.NotInGroup();

        var receiverInGroup = groupChat.Members.Any(m => m.TheGuyId == receiverId);
        if (!receiverInGroup)
            return SendMessageResponse.ViaGroupChatValidationFailed();

        return SendMessageResponse.Success(Guid.NewGuid());
    }

    /// <summary>
    /// 验证群聊消息发送权限
    /// </summary>
    public async Task<SendMessageResponse> ValidateGroupChatMessageAsync(
        string chatUniqueMark,
        Guid senderId)
    {
        // 1. 检查聊天是否存在
        var chat = await context.Chats
            .Include(c => c.Contacts)
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
            
        if (chat == null)
            return SendMessageResponse.ChatNotFound();
        
        return await  ValidateGroupChatMessageAsync(chat, senderId);
    }

    public async Task<SendMessageResponse> ValidateGroupChatMessageAsync(
        Chat chat, 
        Guid senderId)
    {
        
        var sender = await context.Users.FindAsync(senderId);
        if (sender == null)
            return SendMessageResponse.SenderNotFound();

        // 3. 检查聊天是否为群聊
        var groupChat = await context.GroupChats
            .Include(gc => gc.Members)
            .Include(gc => gc.Settings)
            .FirstOrDefaultAsync(gc => gc.UniqueMark == chat.UniqueMark);
            
        if (groupChat == null)
            return SendMessageResponse.Unauthorized("Not a group");

        // 4. 检查群聊状态
        if (groupChat.Status == EChatStatus.GroupDisabled)
            return SendMessageResponse.GroupChatDisabled();

        // 5. 检查发送者是否在群聊中
        var senderMember = groupChat.Members.FirstOrDefault(m => m.TheGuyId == senderId);
        if (senderMember == null)
            return SendMessageResponse.NotInGroup();

        // 6. 检查发送者是否被禁言
        if (senderMember.IsSilent)
        {
            // 检查禁言是否已过期
            if (senderMember.SilentUntil.HasValue && senderMember.SilentUntil.Value > DateTime.UtcNow)
                return SendMessageResponse.UserMuted();
            else
            {
                senderMember.IsSilent = false;
                senderMember.SilentUntil = null;
                await context.SaveChangesAsync();
            }
        }

        if (groupChat.Settings?.IsAllSilent == true && 
            senderMember.Type != EGroupMemberType.Admin && 
            senderMember.Type != EGroupMemberType.Owner) // duplicated, but i forgot where was my function. i'm so tired,, i need sleep[
        {
            return SendMessageResponse.UserMuted();
        }

        return SendMessageResponse.Success(Guid.NewGuid());
    }

    /// <summary>
    /// 验证非群聊发起的私聊消息
    /// </summary>
    private async Task<SendMessageResponse> ValidateNonGroupPrivateChatAsync(PrivateChat privateChat)
    {
        // 获取接收者的隐私设置
        var receiverPrivacy = await context.PrivacySettings
            .FirstOrDefaultAsync(p => p.UserId == privateChat.ReceiverId);
            
        if (receiverPrivacy == null)
            return SendMessageResponse.InternalError("无法获取接收者隐私设置");

        // 如果接收者不可被公开搜索，禁止一切非群聊发起的私聊
        return !receiverPrivacy.IsDiscoverableViaSearch ? 
            SendMessageResponse.Unauthorized("接收者隐私设置禁止非群聊发起的私聊") : 
            SendMessageResponse.Success(Guid.NewGuid());
    }

    /// <summary>
    /// 验证非好友关系下的消息类型
    /// </summary>
    public async Task<SendMessageResponse> ValidateMessageTypeForNonFriendAsync(
        string chatUniqueMark, 
        Guid senderId, 
        EMessageType messageType,
        string? viaGroupChatId = null)
    {
        Console.WriteLine($"[ValidateMessageType] 开始验证 - chatMark: {chatUniqueMark}, senderId: {senderId}, messageType: {messageType}");
        
        var chat = await context.Chats
            .Include(c => c.Contacts)
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
            
        if (chat == null)
        {
            Console.WriteLine($"[ValidateMessageType] 聊天不存在");
            return SendMessageResponse.ChatNotFound();
        }

        var privateChat = await context.PrivateChats
            .FirstOrDefaultAsync(pc => pc.UniqueMark == chat.UniqueMark);
            
        if (privateChat == null)
        {
            Console.WriteLine($"[ValidateMessageType] 非私聊类型");
            return SendMessageResponse.Unauthorized("非私聊类型");
        }

        Console.WriteLine($"[ValidateMessageType] 私聊信息 - InitById: {privateChat.InitById}, ReceiverId: {privateChat.ReceiverId}, IsInformal: {privateChat.IsInformal}");

        // 获取私聊双方的用户对象
        var initUser = await context.Users.FirstOrDefaultAsync(u => u.LocalId == privateChat.InitById);
        var receiverUser = await context.Users.FirstOrDefaultAsync(u => u.LocalId == privateChat.ReceiverId);
        
        if(initUser == null || receiverUser == null)
        {
            Console.WriteLine($"[ValidateMessageType] 用户不存在 - initUser: {initUser != null}, receiverUser: {receiverUser != null}");
            return SendMessageResponse.Unauthorized($"InitUser or ReceiverUser is null: init:{initUser is null}, recv:{receiverUser is null}");
        }
        
        // 检查私聊双方是否为好友关系
        var isFriend = RelationshipHelper.IsUserAFriend(context, initUser, receiverUser);
        Console.WriteLine($"[ValidateMessageType] 好友关系检查 - isFriend: {isFriend}, IsInformal: {privateChat.IsInformal}");
        
        // 如果是好友关系且不是临时私聊，允许发送任何类型的消息
        if (isFriend && !privateChat.IsInformal)
        {
            Console.WriteLine($"[ValidateMessageType] 是好友关系，允许发送");
            return SendMessageResponse.Success(Guid.NewGuid());
        }

        // 如果通过群聊发起，验证群聊权限
        if (!string.IsNullOrEmpty(viaGroupChatId))
        {
            Console.WriteLine($"[ValidateMessageType] 尝试通过群聊验证 - viaGroupChatId: {viaGroupChatId}");
            var actualReceiverId = privateChat.InitById == senderId ? privateChat.ReceiverId : privateChat.InitById;
            var groupValidationResult = await ValidateViaGroupChatAsync(viaGroupChatId, senderId, actualReceiverId);
            if (groupValidationResult.ResultCanBe == EMessageSendResult.Success)
            {
                Console.WriteLine($"[ValidateMessageType] 群聊验证通过");
                return SendMessageResponse.Success(Guid.NewGuid());
            }
        }

        // 非好友关系，只允许发送请求类型的消息
        if (messageType != EMessageType.Requesting)
        {
            Console.WriteLine($"[ValidateMessageType] 非好友关系，只允许Requesting类型，当前类型: {messageType}");
            return SendMessageResponse.Unauthorized($"REQUESTING ONLY (isFriend:{isFriend}, IsInformal:{privateChat.IsInformal})");
        }

        Console.WriteLine($"[ValidateMessageType] 验证通过 (Requesting消息)");
        return SendMessageResponse.Success(Guid.NewGuid());
    }

    /// <summary>
    /// 通用消息内容验证
    /// </summary>
    public SendMessageResponse ValidateMessageContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return SendMessageResponse.ContentEmpty();

        if (content.Length > 5000) // 限制消息长度
            return SendMessageResponse.InternalError("Too large message");

        return SendMessageResponse.Success(Guid.NewGuid());
    }
}
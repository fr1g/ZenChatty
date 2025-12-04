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
        var chat = await context.Chats
            .Include(c => c.Contacts)
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
            
        if (chat == null)
            return SendMessageResponse.ChatNotFound();
        
        return await ValidatePrivateChatMessageAsync(chat, senderId, viaGroupChatId);
    }

    public async Task<SendMessageResponse> ValidatePrivateChatMessageAsync(
        Chat chat, 
        Guid senderId, 
        string? viaGroupChatId = null)
    {

        var sender = await context.Users.FindAsync(senderId);
        if (sender == null)
            return SendMessageResponse.SenderNotFound();

        // 3. 检查聊天是否为私聊
        var privateChat = await context.PrivateChats
            // .Include(pc => pc.Receiver)
            .FirstOrDefaultAsync(pc => pc.UniqueMark == chat.UniqueMark);
            
        if (privateChat == null)
            return SendMessageResponse.Unauthorized("非私聊类型");

        // 4. 检查发送者是否在聊天中
        if (chat.Contacts.All(c => c.HostId != senderId))
            return SendMessageResponse.Unauthorized("发送者不在该私聊中");
        
        // if(privateChat.IsInformal && privateChat.Receiver.Privacies.IsDiscoverableViaSearch && )

        // 5. 检查接收者是否拉黑了发送者
        var receiverContact = await context.Contacts
            .FirstOrDefaultAsync(c => c.HostId == privateChat.ReceiverId && c.ObjectId == senderId.ToString());
            
        if (receiverContact?.IsBlocked == true)
            return SendMessageResponse.PrivateChatBlocked();

        // 6. 如果通过群聊发起，验证群聊权限
        if (!string.IsNullOrEmpty(viaGroupChatId))
        {
            var groupValidationResult = await ValidateViaGroupChatAsync(viaGroupChatId, senderId, privateChat.ReceiverId);
            if (groupValidationResult.ResultCanBe != EMessageSendResult.Success)
                return groupValidationResult;
        }
        else
        {
            // 7. 非群聊发起的私聊，检查隐私设置和消息类型限制
            var privacyValidationResult = await ValidateNonGroupPrivateChatAsync(privateChat);
            if (privacyValidationResult.ResultCanBe != EMessageSendResult.Success)
                return privacyValidationResult;
        }

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
        var chat = await context.Chats
            .Include(c => c.Contacts)
            .FirstOrDefaultAsync(c => c.UniqueMark == chatUniqueMark);
            
        if (chat == null)
            return SendMessageResponse.ChatNotFound();

        var privateChat = await context.PrivateChats
            .FirstOrDefaultAsync(pc => pc.UniqueMark == chat.UniqueMark);
            
        if (privateChat == null)
            return SendMessageResponse.Unauthorized("非私聊类型");

        // var pc = await context.PrivateChats.FirstAsync(pc => pc.InitById == privateChat.InitById);
        // 检查是否为好友关系
        // var isFriend = await context.Contacts
        //     .Include(c => c.Object)
        //     .AnyAsync(c => c.HostId == privateChat.ReceiverId && 
        //                   c.ObjectId == senderId.ToString() && 
        //                   !c.IsBlocked);
            // && !((PrivateChat)c.Object).IsInformal);
            
        // getting receiver
        var sender = await context.Users.FirstOrDefaultAsync(u => u.LocalId == privateChat.InitById);
        var receiver = await context.Users.FirstOrDefaultAsync(u => u.LocalId == privateChat.ReceiverId);
        
        if(sender == null || receiver == null)
            return SendMessageResponse.Unauthorized($"Sender or Receiver is null: R::{receiver is null}");
        
        var isFriend = RelationshipHelper.IsUserAFriend(context, sender, receiver);
        
        if (isFriend && !privateChat.IsInformal)
            return SendMessageResponse.Success(Guid.NewGuid());

        if (!string.IsNullOrEmpty(viaGroupChatId))
        {
            var groupValidationResult = await ValidateViaGroupChatAsync(viaGroupChatId, senderId, privateChat.ReceiverId);
            if (groupValidationResult.ResultCanBe == EMessageSendResult.Success)
                return SendMessageResponse.Success(Guid.NewGuid());
        }

        if (messageType != EMessageType.Requesting)
            return SendMessageResponse.Unauthorized($"REQUESTING ONLY ({isFriend})");

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
var EUserStatus;
(function (EUserStatus) {
    EUserStatus[EUserStatus["Online"] = 0] = "Online";
    EUserStatus[EUserStatus["Offline"] = 1] = "Offline";
    EUserStatus[EUserStatus["Quit"] = 2] = "Quit";
    EUserStatus[EUserStatus["Disabled"] = 3] = "Disabled";
    EUserStatus[EUserStatus["New"] = 4] = "New";
    EUserStatus[EUserStatus["Unknown"] = 5] = "Unknown";
})(EUserStatus || (EUserStatus = {}));
var EGender;
(function (EGender) {
    EGender[EGender["Male"] = 0] = "Male";
    EGender[EGender["Female"] = 1] = "Female";
    EGender[EGender["Unset"] = 2] = "Unset";
})(EGender || (EGender = {}));
var EChatStatus;
(function (EChatStatus) {
    EChatStatus[EChatStatus["Normal"] = 0] = "Normal";
    EChatStatus[EChatStatus["GroupDisabled"] = 1] = "GroupDisabled";
    EChatStatus[EChatStatus["Unreachable"] = 2] = "Unreachable";
})(EChatStatus || (EChatStatus = {}));
var EMessageType;
(function (EMessageType) {
    EMessageType[EMessageType["Normal"] = 0] = "Normal";
    EMessageType[EMessageType["Requesting"] = 1] = "Requesting";
    EMessageType[EMessageType["Quote"] = 2] = "Quote";
    EMessageType[EMessageType["Forward"] = 3] = "Forward";
    EMessageType[EMessageType["Event"] = 4] = "Event";
    EMessageType[EMessageType["Announcement"] = 5] = "Announcement";
    EMessageType[EMessageType["Canceled"] = 6] = "Canceled";
})(EMessageType || (EMessageType = {}));
var EFileType;
(function (EFileType) {
    EFileType[EFileType["Image"] = 0] = "Image";
    EFileType[EFileType["Video"] = 1] = "Video";
    EFileType[EFileType["Audio"] = 2] = "Audio";
    EFileType[EFileType["Document"] = 3] = "Document";
    EFileType[EFileType["Other"] = 4] = "Other";
})(EFileType || (EFileType = {}));
var EGroupMemberType;
(function (EGroupMemberType) {
    EGroupMemberType[EGroupMemberType["Owner"] = 0] = "Owner";
    EGroupMemberType[EGroupMemberType["Admin"] = 1] = "Admin";
    EGroupMemberType[EGroupMemberType["Member"] = 2] = "Member";
})(EGroupMemberType || (EGroupMemberType = {}));
var EMessageSendResult;
(function (EMessageSendResult) {
    EMessageSendResult[EMessageSendResult["Success"] = 200] = "Success";
    EMessageSendResult[EMessageSendResult["Unauthorized"] = 401] = "Unauthorized";
    EMessageSendResult[EMessageSendResult["Forbidden"] = 403] = "Forbidden";
    EMessageSendResult[EMessageSendResult["ChatNotFound"] = 404] = "ChatNotFound";
    EMessageSendResult[EMessageSendResult["SenderNotFound"] = 405] = "SenderNotFound";
    EMessageSendResult[EMessageSendResult["ContentEmpty"] = 406] = "ContentEmpty";
    EMessageSendResult[EMessageSendResult["PrivateChatBlocked"] = 407] = "PrivateChatBlocked";
    EMessageSendResult[EMessageSendResult["GroupChatDisabled"] = 408] = "GroupChatDisabled";
    EMessageSendResult[EMessageSendResult["PrivateChatNotAllowed"] = 409] = "PrivateChatNotAllowed";
    EMessageSendResult[EMessageSendResult["NotInGroup"] = 410] = "NotInGroup";
    EMessageSendResult[EMessageSendResult["UserMuted"] = 411] = "UserMuted";
    EMessageSendResult[EMessageSendResult["ViaGroupChatValidationFailed"] = 412] = "ViaGroupChatValidationFailed";
    EMessageSendResult[EMessageSendResult["InternalError"] = 500] = "InternalError";
})(EMessageSendResult || (EMessageSendResult = {}));
var EPrivacyVisibilityRange;
(function (EPrivacyVisibilityRange) {
    EPrivacyVisibilityRange[EPrivacyVisibilityRange["None"] = 0] = "None";
    EPrivacyVisibilityRange[EPrivacyVisibilityRange["Friends"] = 1] = "Friends";
    EPrivacyVisibilityRange[EPrivacyVisibilityRange["FriendsAndGroups"] = 2] = "FriendsAndGroups";
    EPrivacyVisibilityRange[EPrivacyVisibilityRange["Everyone"] = 3] = "Everyone";
})(EPrivacyVisibilityRange || (EPrivacyVisibilityRange = {}));

/**
 * 聊天基础类
 */
class Chat {
    uniqueMark;
    initBy;
    history;
    status;
    constructor(initBy, history = [], uniqueMark = undefined, status = EChatStatus.Normal) {
        this.history = history;
        this.uniqueMark = uniqueMark;
        this.initBy = initBy;
        this.status = status;
    }
}
class PrivateChat extends Chat {
    isInformal;
    receiver;
    constructor(initBy, receiver, isInformal = true) {
        super(initBy);
        this.receiver = receiver;
        this.isInformal = isInformal;
    }
}
class GroupChat extends Chat {
    members;
    settings;
    groupAnnounce;
    constructor(initBy, members, settings = new GroupSettings(), groupAnnounce = []) {
        super(initBy);
        this.members = members;
        this.settings = settings;
        this.groupAnnounce = groupAnnounce;
    }
}
class GroupSettings {
    displayName;
    avatarFileLocator;
    isAllSilent;
    isInviteOnly; // invite link, QR code with expiration 
    isPrivateChatAllowed;
    constructor(displayName = "Group", avatarFileLocator = null, isAllSilent = false, isInviteOnly = false, isPrivateChatAllowed = false) {
        this.displayName = displayName;
        this.avatarFileLocator = avatarFileLocator;
        this.isAllSilent = isAllSilent;
        this.isInviteOnly = isInviteOnly;
        this.isPrivateChatAllowed = isPrivateChatAllowed;
    }
}
/**
 * 群组成员类
 */
class GroupChatMember {
    theGuy;
    type;
    givenTitle;
    nickname;
    isSilent;
    joinedAt;
    silentUntil;
    constructor(member, type = EGroupMemberType.Member, givenTitle = null, nickname = "", isSilent = false, joinedAt = new Date(), silentUntil = null) {
        this.theGuy = member;
        this.type = type;
        this.givenTitle = givenTitle;
        this.nickname = nickname;
        this.isSilent = isSilent;
        this.joinedAt = joinedAt;
        this.silentUntil = silentUntil;
    }
}
/**
 * 聊天响应类
 */
class ChatResponse {
    chatId = '';
    chatType = '';
    displayName = '';
    avatarUrl;
    createdAt = new Date();
    unreadCount = 0;
    lastActivity = new Date();
    isBlocked = false;
    isPinned = false;
    lastMessagePreview;
}

class Contact {
    contactId;
    host;
    object;
    lastUnreadCount;
    lastUsed;
    addTime;
    isPinned;
    isBlocked;
    displayName;
    avatarFileLocator;
    constructor(id, host, object, lastUnreadCount = 0, lastUsed = new Date(), addTime = new Date(), isPinned = false, isBlocked = false, displayName = null, avatarFileLocator = null) {
        this.contactId = id;
        this.host = host;
        this.object = object;
        this.lastUnreadCount = lastUnreadCount;
        this.lastUsed = lastUsed;
        this.addTime = addTime;
        this.isPinned = isPinned;
        this.isBlocked = isBlocked;
        let isGroup = object instanceof GroupChat;
        if (displayName != null) {
            this.displayName = displayName;
        }
        else if (isGroup) {
            this.displayName = object.settings.displayName;
        }
        else {
            if (host.localId === object.initBy.localId) {
                this.displayName = object.receiver.displayName;
            }
            else {
                this.displayName = object.initBy.displayName;
            }
        }
        if (avatarFileLocator != null) {
            this.avatarFileLocator = avatarFileLocator;
        }
        else if (isGroup) {
            this.avatarFileLocator = object.settings.avatarFileLocator;
        }
        else {
            if (host.localId === object.initBy.localId) {
                this.avatarFileLocator = object.receiver.avatarFileLocator;
            }
            else {
                this.avatarFileLocator = object.initBy.avatarFileLocator;
            }
        }
    }
}
class PrivacySettings {
    isDiscoverableViaSearch;
    isInvitableToGroup;
    isAddableFromGroup;
    isNewChatKeepSilent;
    contactVisibility;
    bioVisibility;
    genderVisibility;
    constructor(isDiscoverableViaSearch = false, isInvitableToGroup = false, isAddableFromGroup = false, isNewChatKeepSilent = false, contactVisibility = EPrivacyVisibilityRange.None, bioVisibility = EPrivacyVisibilityRange.FriendsAndGroups, genderVisibility = EPrivacyVisibilityRange.Everyone) {
        this.isDiscoverableViaSearch = isDiscoverableViaSearch;
        this.isInvitableToGroup = isInvitableToGroup;
        this.isAddableFromGroup = isAddableFromGroup;
        this.isNewChatKeepSilent = isNewChatKeepSilent;
        this.contactVisibility = contactVisibility;
        this.bioVisibility = bioVisibility;
        this.genderVisibility = genderVisibility;
    }
}
class PrivacySettingsResponse {
    privacySettings = new PrivacySettings();
    success = false;
    message = '';
}
class DeviceSession {
    deviceId = '';
    userId = '';
    deviceName = '';
    deviceType = '';
    lastActiveAt = new Date();
    createdAt = new Date();
}
class UserFile {
    fileId = '';
    userId = '';
    fileName = '';
    fileType = '';
    fileSize = 0;
    filePath = '';
    uploadedAt = new Date();
}
class GroupInviteLink {
    inviteLinkId = '';
    groupChatId = '';
    inviteCode = '';
    createdById = '';
    maxUses = 0;
    usedCount = 0;
    expiresAt;
    createdAt = new Date();
}

class User {
    localId;
    email;
    displayName;
    avatarFileLocator;
    backgroundFileLocator;
    bio;
    customId;
    phoneNumber;
    status;
    gender;
    birth;
    registeredAt;
    privacies;
    constructor(email, displayName, customId, localId = "ungiven", registeredAt = new Date(), avatarFileLocator = 'img:xdefaultavtr.jpg', backgroundFileLocator = 'img:xdefaultback.jpg', bio = "unset bio.", phoneNumber = "+unsetnumber", status = EUserStatus.Online, gender = EGender.Unset, birth = undefined, privacies = new PrivacySettings()) {
        this.localId = localId;
        this.email = email;
        this.displayName = displayName;
        this.avatarFileLocator = avatarFileLocator;
        this.backgroundFileLocator = backgroundFileLocator;
        this.bio = bio;
        this.customId = customId;
        this.phoneNumber = phoneNumber;
        this.status = status;
        this.gender = gender;
        this.birth = birth;
        this.registeredAt = registeredAt;
        this.privacies = privacies;
    }
}
class UserInfoResponse {
    localId = '';
    message = '';
    email;
    displayName;
    avatarFileLocator;
    backgroundFileLocator;
    bio;
    customId;
    phoneNumber;
    status = EUserStatus.Unknown;
    gender = EGender.Unset;
    birth;
    registeredAt = new Date();
    success = false;
}
class UserAuthObject {
    userId = '';
    passwordHash = '';
    passwordSalt = '';
}

class AuthResponse {
    accessToken = '';
    refreshToken = '';
    accessTokenExpiresAt = new Date();
    refreshTokenExpiresAt = new Date();
    deviceId = '';
    userInfo = new UserInfo();
}
class UserInfo {
    userId = '';
    username = '';
    displayName = '';
    email = '';
    status = '';
}
class LoginRequest {
    username = '';
    password = '';
    deviceId = '';
}
class RegisterRequest {
    email = '';
    username = '';
    password = '';
    displayName = '';
    deviceId = '';
}
class RefreshTokenRequest {
    refreshToken = '';
    deviceId = '';
}
class BasicResponse {
    success = false;
    message = '';
}

class Message {
    traceId = '';
    _content = '';
    info = '';
    senderId = '';
    sender;
    viaGroupChatId;
    ofChatId = '';
    isMentioningAll = false;
    isCanceled = false;
    isAnnouncement = false;
    mentionedUserGuids;
    type = EMessageType.Normal;
    sentTimestamp = 0;
    serverCaughtTimestamp = 0;
    ofChat;
    constructor(sender, ofChat, content) {
        this.sender = sender;
        this.ofChat = ofChat;
        this._content = content;
    }
    get content() {
        return this.isCanceled ? '' : this._content;
    }
    set content(value) {
        this._content = value;
    }
}
class SendMessageResponse {
    messageId = '';
    sentTimestamp = 0;
    result = 'Empty';
    errorMessage;
}

class CreatePrivateChatRequest {
    participantUserId = '';
}
class CreateGroupChatRequest {
    groupName = '';
    description = '';
    initialMemberIds = [];
}
class SendMessageRequest {
    chatId = '';
    content = '';
    messageType = EMessageType.Normal;
    mentionedUserIds;
    isMentioningAll = false;
    isAnnouncement = false;
}
class RecallMessageRequest {
    messageId = '';
    chatId = '';
}
class GroupManagementRequest {
    groupId = '';
    targetUserId = '';
    action = '';
}
class UpdateGroupSettingsRequest {
    groupId = '';
    groupName;
    description;
    allowAnyoneInvite;
    requireApprovalToJoin;
    allowSendMessages;
    allowSendMedia;
    allowSendFiles;
}
class GroupInviteLinkRequest {
    groupId = '';
    maxUses = 0;
    expiresAt;
}
class PrivacyCheckRequest {
    targetUserId = '';
    checkType = '';
}

export { AuthResponse, BasicResponse, Chat, ChatResponse, Contact, CreateGroupChatRequest, CreatePrivateChatRequest, DeviceSession, EChatStatus, EFileType, EGender, EGroupMemberType, EMessageSendResult, EMessageType, EPrivacyVisibilityRange, EUserStatus, GroupChat, GroupChatMember, GroupInviteLink, GroupInviteLinkRequest, GroupManagementRequest, GroupSettings, LoginRequest, Message, PrivacyCheckRequest, PrivacySettings, PrivacySettingsResponse, PrivateChat, RecallMessageRequest, RefreshTokenRequest, RegisterRequest, SendMessageRequest, SendMessageResponse, UpdateGroupSettingsRequest, User, UserAuthObject, UserFile, UserInfo, UserInfoResponse };
//# sourceMappingURL=index.js.map

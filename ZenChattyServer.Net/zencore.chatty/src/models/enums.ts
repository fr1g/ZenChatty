export enum EUserStatus {
    Online, Offline, Quit,
    Disabled, New,
    Unknown,
}

export enum EGender {
    Male,
    Female,
    Unset
}

export enum EChatStatus {
    Normal,
    GroupDisabled,
    Unreachable
}

export enum EMessageType {
    Normal,
    Requesting,
    Quote,
    Forward,
    Event, // Send to receiver, as a system message (left from chat, kicked from chat, blocked message)
    Announcement,
    Canceled
}

export enum EFileType {
    Image,
    Video,
    Audio,
    Document,
    Other,
}

export enum EGroupMemberType {
    Owner,
    Admin,
    Member,
}

export enum EMessageSendResult {
    Success = 200,
    Unauthorized = 401,
    Forbidden = 403,
    ChatNotFound = 404,
    SenderNotFound = 405,
    ContentEmpty = 406,
    PrivateChatBlocked = 407,
    GroupChatDisabled = 408,
    PrivateChatNotAllowed = 409,
    NotInGroup = 410,
    UserMuted = 411,
    ViaGroupChatValidationFailed = 412,
    InternalError = 500
}

export enum EPrivacyVisibilityRange {
    None, Friends, FriendsAndGroups, Everyone
}
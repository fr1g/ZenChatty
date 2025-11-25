export declare enum EUserStatus {
    Online = 0,
    Offline = 1,
    Quit = 2,
    Disabled = 3,
    New = 4,
    Unknown = 5
}
export declare enum EGender {
    Male = 0,
    Female = 1,
    Unset = 2
}
export declare enum EChatStatus {
    Normal = 0,
    GroupDisabled = 1,
    Unreachable = 2
}
export declare enum EMessageType {
    Normal = 0,
    Requesting = 1,
    Quote = 2,
    Forward = 3,
    Event = 4,// Send to receiver, as a system message (left from chat, kicked from chat, blocked message)
    Announcement = 5,
    Canceled = 6
}
export declare enum EFileType {
    Image = 0,
    Video = 1,
    Audio = 2,
    Document = 3,
    Other = 4
}
export declare enum EGroupMemberType {
    Owner = 0,
    Admin = 1,
    Member = 2
}
export declare enum EMessageSendResult {
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
export declare enum EPrivacyVisibilityRange {
    None = 0,
    Friends = 1,
    FriendsAndGroups = 2,
    Everyone = 3
}
//# sourceMappingURL=enums.d.ts.map
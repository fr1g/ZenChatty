namespace ZenChattyServer.Net.Models.Enums;

public enum EUserStatus
{
    Online, // User manual set to Online. When others querying this user's status, return this if user is active.
    Offline, // User manual set to Offline. When others querying this user's status, return this if user is inactive.
    Quit, // User wants to quit from socialing. When others querying this user's status, return Offline; 
          // but if user himself getting his status, return Quit.
    Disabled, // User account is disabled. When others querying this user's status, return Offline. 
              // When other user trying to look up the disabled user's info, return 404
    Unknown, // User status is unknown. When others querying this user's status, return Unknown.
    New // User is new. When user was just registered, set his status to New.
}
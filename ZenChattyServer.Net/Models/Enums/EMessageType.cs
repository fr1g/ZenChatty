namespace ZenChattyServer.Net.Models.Enums;

public enum EMessageType
{ // no need for backend to manage message types (except Requesting - maybe user by their privacy settings won't accept any requests)
    Normal, 
    Requesting, 
    Quote, 
    Forward, 
    Event, // Send to receiver, as a system message (left from chat, kicked from chat, blocked message)
    Announcement,
    Canceled
}
namespace ZenChattyServer.Net.Models;

public class PrivateChat(User initBy, User receiver) : Chat(initBy)
{
    public bool IsInformal { get; set; } = true; // not added into contact
    public User Receiver { get; set; } = receiver;
}
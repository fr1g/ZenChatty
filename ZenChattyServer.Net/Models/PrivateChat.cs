namespace ZenChattyServer.Net.Models;

public class PrivateChat(User initBy, User receiver) : Chat(initBy)
{

    public User Receiver { get; set; } = receiver;
}
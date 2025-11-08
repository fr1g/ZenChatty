using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

public class Chat(User initBy)
{
    public string UniqueMark { get; set; }  = Guid.NewGuid().ToString();
    public User InitBy { get; set; } = initBy;
    public EChatStatus Status { get; set; } = EChatStatus.Normal;
}
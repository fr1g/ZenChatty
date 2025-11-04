using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

public class Message(User sender, Chat ofChat, string content)
{
    public string TraceId { get; set; } = Guid.NewGuid().ToString();
    public bool IsCanceled { get; set; } = false;
    
    private string _content = content;
    public string Content
    {
        get
        {
            if (this.IsCanceled) return "";
            else return this._content;
        }
        set
        {
            this._content = value;
        }
    }

    public string Info { get; set; } = ""; // can be empty, hint, or some description JSON

    public EMessageType Type { get; set; } = EMessageType.Normal;
    public long SentTimestamp { get; set; }
    public long ServerCaughtTimestamp { get; set; } = DateTime.Now.ToFileTimeUtc();

    public User Sender { get; set; } = sender;
    public Chat OfChat { get; set; } = ofChat;
}
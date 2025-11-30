using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ZenChattyServer.Net.Models.Enums;

namespace ZenChattyServer.Net.Models;

public class Message(User sender, Chat ofChat, string content)
{
    public Message () : this(null!, null!, null!){}
    [Key]
    public string TraceId { get; set; } = Guid.NewGuid().ToString(); // todo ??????
    public bool IsCanceled { get; set; } = false;
    
    private string _content = content;
    public string Content
    {
        get => this.IsCanceled ? "" : this._content;
        set => this._content = value;
    }

    public string Info { get; set; } = ""; // can be empty, hint, or some description JSON

    public EMessageType Type { get; set; } = EMessageType.Normal;
    public long SentTimestamp { get; set; }
    public long ServerCaughtTimestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    
    public bool IsMentioningAll { get; set; } = false; // if is in private chat, will act like a force attention on object
    public string[]? MentionedUserGuids { get; set; } = null;
    
    public bool IsAnnouncement { get; set; } = false; // 是否为群公告
    /* Mention behavior ():
         * Client:
             * User input @, showing "Add Mention" button which multi-select user and auto input those usernames with prefix @
             * When sending message, find every '\@.*\' and get those as valid group-member-display-name,
             * find them and append their UUID into this array, to let backend decide who should be pushed Announcement.
             * Therefore, if the sender finally removed name after @, the one who was attempted to be mentioned won't get Announcement
         * Server:
             * Server get such array of guids, and check if these are existing users in current group
             * Push Announcement to all mentioned users, with entire of this Message inside.
             * if guid is invalid, IGNORE them.
     */

    public Guid SenderId { get; set; }
    public virtual User? Sender { get; set; } = sender;
    
    public string? ViaGroupChatId { get; set; } = null;
    
    public string OfChatId { get; set; }
    // nav back
    public virtual Chat OfChat { get; set; } = ofChat;
}
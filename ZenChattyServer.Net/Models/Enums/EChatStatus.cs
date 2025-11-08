namespace ZenChattyServer.Net.Models.Enums;

public enum EChatStatus
{
    Normal, // chatable chat 
    GroupDisabled, // the group has been disabled, because the owner disassembled or illegal 
    Unreachable // the (private) chatting object is not reachable due to privacy settings 
    
}
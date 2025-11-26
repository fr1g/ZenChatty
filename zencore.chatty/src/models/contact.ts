import { Chat, GroupChat, PrivateChat } from "./chat";
import { User } from "./user";

export default class Contact {
    contactId: string;
    host: User;
    object: Chat;  
    lastUnreadCount: number;  
    lastUsed: Date;
    addTime: Date;
    isPinned: boolean;
    isBlocked: boolean;
    displayName: string | null;
    avatarFileLocator: string | null;

    constructor(
        id: string,
        host: User,
        object: Chat,
        lastUnreadCount: number = 0,
        lastUsed: Date = new Date(),
        addTime: Date = new Date(),
        isPinned: boolean = false,
        isBlocked: boolean = false,
        displayName: string | null = null,
        avatarFileLocator: string | null = null
    ) {
        this.contactId = id;
        this.host = host;
        this.object = object;
        this.lastUnreadCount = lastUnreadCount;
        this.lastUsed = lastUsed;
        this.addTime = addTime;
        this.isPinned = isPinned;
        this.isBlocked = isBlocked;

        let isGroup = object instanceof GroupChat;
         
        if(displayName != null) {
            this.displayName = displayName;
        }
        else if (isGroup) {
            this.displayName = (object as GroupChat).settings.displayName;
        } else {
            if(host.localId === (object as PrivateChat).initBy.localId) {
                this.displayName = (object as PrivateChat).receiver.displayName;
            } else {
                this.displayName = (object as PrivateChat).initBy.displayName;
            }
        }
        if(avatarFileLocator != null) {
            this.avatarFileLocator = avatarFileLocator;
        }
        else if (isGroup) {
            this.avatarFileLocator = (object as GroupChat).settings.avatarFileLocator;
        }
        else{
            if(host.localId === (object as PrivateChat).initBy.localId) {
                this.avatarFileLocator = (object as PrivateChat).receiver.avatarFileLocator;
            } else {
                this.avatarFileLocator = (object as PrivateChat).initBy.avatarFileLocator;
            }
        }
    }
}
import Chat from './Chat';
import User from './User';
import { GroupChat } from './GroupChat';
import { PrivateChat } from './PrivateChat';

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

    constructor(
        id: string,
        host: User,
        object: Chat,
        lastUnreadCount: number = 0,
        lastUsed: Date = new Date(),
        addTime: Date = new Date(),
        isPinned: boolean = false,
        isBlocked: boolean = false,
        displayName: string | null = null
    ) {
        this.contactId = id;
        this.host = host;
        this.object = object;
        this.lastUnreadCount = lastUnreadCount;
        this.lastUsed = lastUsed;
        this.addTime = addTime;
        this.isPinned = isPinned;
        this.isBlocked = isBlocked;
         
        if(displayName != null) {
            this.displayName = displayName;
        }
        else if (object instanceof GroupChat) {
            this.displayName = (object as GroupChat).settings.displayName;
        } else {
            if(host.localId === (object as PrivateChat).initBy.localId) {
                this.displayName = (object as PrivateChat).receiver.displayName;
            } else {
                this.displayName = (object as PrivateChat).initBy.displayName;
            }
        }
    }
}
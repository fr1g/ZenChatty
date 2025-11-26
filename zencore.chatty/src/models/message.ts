import { EMessageType, EMessageSendResult } from './enums';
import { User } from './user';
import { Chat } from './chat';

export class Message {

    public traceId: string = '';
    private _content: string = '';
    public info: string = '';
    public senderId: string = '';
    public sender: User;
    public viaGroupChatId?: string;
    public ofChatId: string = '';

    public isMentioningAll: boolean = false;
    public isCanceled: boolean = false;
    public isAnnouncement: boolean = false;

    public mentionedUserGuids?: string[];

    public type: EMessageType = EMessageType.Normal;
    public sentTimestamp: number = 0;
    public serverCaughtTimestamp: number = 0;

    public ofChat: Chat;

    constructor(sender: User, ofChat: Chat, content: string) {
        this.sender = sender;
        this.ofChat = ofChat;
        this._content = content;
    }

    public get content(): string {
        return this.isCanceled ? '' : this._content;
    }
    public set content(value: string) {
        this._content = value;
    }

}

export class MessageSendResponse {

    public result?: EMessageSendResult;
    public messageId?: string;
    public errorMessage?: string;
    public sentAt?: Date;
    public isQueued: boolean = false;

}
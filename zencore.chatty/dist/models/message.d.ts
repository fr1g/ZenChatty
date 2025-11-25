import { EMessageType } from './enums';
import { User } from './user';
import { Chat } from './chat';
export declare class Message {
    traceId: string;
    private _content;
    info: string;
    senderId: string;
    sender: User;
    viaGroupChatId?: string;
    ofChatId: string;
    isMentioningAll: boolean;
    isCanceled: boolean;
    isAnnouncement: boolean;
    mentionedUserGuids?: string[];
    type: EMessageType;
    sentTimestamp: number;
    serverCaughtTimestamp: number;
    ofChat: Chat;
    constructor(sender: User, ofChat: Chat, content: string);
    get content(): string;
    set content(value: string);
}
export declare class SendMessageResponse {
    messageId: string;
    sentTimestamp: number;
    result: string;
    errorMessage?: string;
}
//# sourceMappingURL=message.d.ts.map
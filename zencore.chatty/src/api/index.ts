import { AuthApiClient } from './auth';
import { UserApiClient } from './user';
import { ChatApiClient } from './chat';
import { MessageApiClient } from './message';
import { ContactApiClient } from './contact';

export class ZenCoreChattyClient {
    public readonly auth: AuthApiClient;
    public readonly user: UserApiClient;
    public readonly chat: ChatApiClient;
    public readonly message: MessageApiClient;
    public readonly contact: ContactApiClient;

    constructor(baseURL: string = 'https://localhost:5637', port: number = 5637, timeout: number = 10000) {

        let assembled = baseURL.match(/:[0-9]/g) ? baseURL : baseURL + ":" + port;

        this.auth = new AuthApiClient(assembled, timeout);
        this.user = new UserApiClient(assembled, timeout);
        this.chat = new ChatApiClient(assembled, timeout);
        this.message = new MessageApiClient(assembled, timeout);
        this.contact = new ContactApiClient(assembled, timeout);
    }

    public setAuthToken(token: string): void {
        this.auth.setAuthToken(token);
        this.user.setAuthToken(token);
        this.chat.setAuthToken(token);
        this.message.setAuthToken(token);
        this.contact.setAuthToken(token);
    }

    public clearAuthToken(): void {
        this.auth.clearAuthToken();
        this.user.clearAuthToken();
        this.chat.clearAuthToken();
        this.message.clearAuthToken();
        this.contact.clearAuthToken();
    }
}

export { AuthApiClient, UserApiClient, ChatApiClient, MessageApiClient, ContactApiClient };
export { ApiClientBase } from './base';
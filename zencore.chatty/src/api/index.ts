import { AuthApiClient } from './auth';
import { UserApiClient } from './user';
import { ChatApiClient } from './chat';
import { MessageApiClient } from './message';
import { FileApiClient } from './file';
import { GroupApiClient } from './group';
import { PrivacyApiClient } from './privacy';
import { ContactApiClient } from './contact';

export interface ClientInitObject {
    baseURL: string | null;
    port: number | null;
    userToken: string | null;
    userAgent: string | undefined;
    timeout: number | null;
};

const _defaultUa = "zencore SDK default";
export function CreateZenCoreClient(config: ClientInitObject) {
    return new ZenCoreClient(
        config.baseURL ?? 'https://localhost:5637',
        config.port ?? 5637,
        config.userToken ?? undefined,
        config.userAgent ?? _defaultUa,
        config.timeout ?? 10000
    )
}

export class ZenCoreClient {
    public readonly auth: AuthApiClient;
    public readonly user: UserApiClient;
    public readonly chat: ChatApiClient;
    public readonly message: MessageApiClient;
    public readonly file: FileApiClient;
    public readonly group: GroupApiClient;
    public readonly privacy: PrivacyApiClient;
    public readonly contact: ContactApiClient;

    public settedTokenRaw: string = "none";

    constructor(baseURL: string = 'https://localhost:5637', 
                port: number = 5637, userToken: string | undefined = undefined, 
                userAgent: string = _defaultUa, timeout: number = 10000
    ) {

        let assembled = baseURL.match(/:[0-9]/g) ? baseURL : baseURL + ":" + port;

        this.auth = new AuthApiClient(assembled, timeout);
        this.user = new UserApiClient(assembled, timeout);
        this.chat = new ChatApiClient(assembled, timeout);
        this.message = new MessageApiClient(assembled, timeout);
        this.file = new FileApiClient(assembled, timeout);
        this.group = new GroupApiClient(assembled, timeout);
        this.privacy = new PrivacyApiClient(assembled, timeout);
        this.contact = new ContactApiClient(assembled, timeout);

        if (userToken) this.setAuthToken(userToken);

    }

    public setAuthToken(token: string): void {
        this.settedTokenRaw = token;
        this.auth.setAuthToken(token);
        this.user.setAuthToken(token);
        this.chat.setAuthToken(token);
        this.message.setAuthToken(token);
        this.file.setAuthToken(token);
        this.group.setAuthToken(token);
        this.privacy.setAuthToken(token);
        this.contact.setAuthToken(token);
    }

    public clearAuthToken(): void {
        this.auth.clearAuthToken();
        this.user.clearAuthToken();
        this.chat.clearAuthToken();
        this.message.clearAuthToken();
        this.file.clearAuthToken();
        this.group.clearAuthToken();
        this.privacy.clearAuthToken();
        this.contact.clearAuthToken();
    }
}

export { AuthApiClient } from './auth';
export { UserApiClient } from './user';
export { ChatApiClient } from './chat';
export { MessageApiClient } from './message';
export { FileApiClient } from './file';
export { GroupApiClient } from './group';
export { PrivacyApiClient } from './privacy';
export { ContactApiClient } from './contact';
export { ApiClientBase } from './base';
import { ClientInitObject, CreateZenCoreClient, ZenCoreClient } from "../api";
import { AuthResponse, EGender, LoginRequest, RefreshTokenRequest } from "../models";
import { Credential } from "../models/front";

export class AuthError extends Error { }

export const AuthActs = {
    async login(loginData: LoginDataForm, clientConfig: ClientInitObject | undefined = undefined, storageMethod: (object: any) => any) {
        let client: ZenCoreClient;
        if (clientConfig) client = CreateZenCoreClient(clientConfig);
        else client = new ZenCoreClient();

        let result: AuthResponse;
        try {
            result = await client.auth.login({ username: loginData.login, password: loginData.passwd, deviceId: loginData.deviceId } as LoginRequest);
        } catch (error) {
            throw error;
        }

        const toStore = {
            UserGuid: result.userInfo.userId,
            UsingDeviceId: loginData.deviceId,
            RefreshToken: result.refreshToken,
            AccessToken: result.accessToken,
            RefreshTokenExpiresAtTimestamp: result.refreshTokenExpiresAt.getTime(),
            AccessTokenExpiresAtTimestamp: result.accessTokenExpiresAt.getTime()
        } as Credential;

        AuthStoreMgrActs.flushCredentials(toStore, storageMethod);

    },
    async register(registerData: RegDataForm, clientConfig: ClientInitObject | undefined = undefined) {
        let client: ZenCoreClient;
        if (clientConfig) client = CreateZenCoreClient(clientConfig);
        else client = new ZenCoreClient();

        let result: AuthResponse;
        await client.auth.register()

    },
    registerAndLogin() {
        // todo later
    },
    async refreshIfNeeded(
        activeCredential: Credential,
        clientConfig: ClientInitObject | undefined = undefined,
        storageMethod: (object: any) => any,
        beforeSpan = 123
    ) {
        // checking on:
        // [ open chat, app blur, app focused(when initiates contact refreshing) ]
        let client: ZenCoreClient;
        if (clientConfig) client = CreateZenCoreClient(clientConfig);
        else client = new ZenCoreClient();

        const now = Date.now();
        if (now + beforeSpan > activeCredential.AccessTokenExpiresAtTimestamp) {
            let result: null | AuthResponse = null;
            let req = {
                deviceId: activeCredential.UsingDeviceId,
                refreshToken: activeCredential.RefreshToken
            } as RefreshTokenRequest;
            result = await client.auth.refreshToken(req);
            if (!result) throw new Error("Failed to refresh token");
            const newCredential = activeCredential;
            newCredential.AccessTokenExpiresAtTimestamp = result.accessTokenExpiresAt.getTime();
            newCredential.AccessToken = result.accessToken;
            AuthStoreMgrActs.flushCredentials(newCredential, storageMethod);
            return newCredential;
        }
        else return activeCredential;
    },
    findPasswd() { // even not avaliable in backend...
        // todo later
    }, // fvck it. no longer wanted to write a find&login method
    logoff() {

    },
    logoffByUserId(userId: string, readMethod: () => Credential | Credential[], clientConfig: ClientInitObject | undefined = undefined) {
        const user = AuthStoreMgrActs.readCredentials(readMethod, userId);
        let client: ZenCoreClient;
        if (clientConfig) client = CreateZenCoreClient(clientConfig);
        else client = new ZenCoreClient();
        client.setAuthToken(user.AccessToken);
        client.auth.logout(user.UsingDeviceId);
        // ... yebucihoule 
    },
    changeEmailAddress() {
        // todo later
        // not planned yet
    }

}

export const AuthStoreMgrActs = {
    readCredentials(readMethod: () => Credential | Credential[], matchingUserId: string | undefined = undefined): Credential {
        try {
            const result = readMethod();
            if (result instanceof Credential)
                if (matchingUserId && result.UserGuid !== matchingUserId) throw new Error("Not Matching Given User Id");
                else return result;
            else
                if (result)
                    if (matchingUserId) {
                        const r = result.filter(c => c.UserGuid == matchingUserId);
                        if (r.length == 0) throw new Error("No Matched Credential");
                        return r[0];
                    } else return result[0]
                else throw new Error("Empty Set")
        } catch (error) {
            throw error;
        }
    },
    flushCredentials(credential: Credential, storageMethod: (object: any) => any) {
        storageMethod(credential); // aaaaaa how to!!!!!!!
    }
}

export interface LoginDataForm {
    login: string;
    passwd: string;
    deviceId: string;
}

export interface RegDataForm {
    customUserId: string | undefined;
    passwd: string;
    email: string;
    displayName: string;
    gender: EGender;
    birthday: undefined | Date;
}
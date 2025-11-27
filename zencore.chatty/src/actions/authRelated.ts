import { ClientInitObject, CreateZenCoreClient, ZenCoreClient } from "../api";
import { LoginDataForm, RegDataForm } from "../models/auth";
import { AuthResponse, BasicResponse, EGender, LoginRequest, RefreshTokenRequest, RegisterRequest } from "../models";
import { Credential } from "../models/front";
import { Tools } from "../tools";

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

        console.log(JSON.stringify(result));
        console.log(`date1: ${result.accessTokenExpiresAt}, type: ${typeof result.accessTokenExpiresAt}`)
        if (typeof result.accessTokenExpiresAt == 'string') {
            result.accessTokenExpiresAt = Tools.dotnetDateParse(result.accessTokenExpiresAt);
            result.refreshTokenExpiresAt = Tools.dotnetDateParse(result.refreshTokenExpiresAt as never);
        }
        const toStore = {
            UserGuid: result.userInfo.userId,
            UsingDeviceId: loginData.deviceId,
            RefreshToken: result.refreshToken,
            AccessToken: result.accessToken,
            RefreshTokenExpiresAtTimestamp: result.refreshTokenExpiresAt.getTime(),
            AccessTokenExpiresAtTimestamp: result.accessTokenExpiresAt.getTime()
        } as Credential;

        AuthStoreMgrActs.flushCredential(toStore, storageMethod);
        return toStore;
    },
    async register(registerData: RegDataForm, clientConfig: ClientInitObject | undefined = undefined) {
        let client: ZenCoreClient;
        if (clientConfig) client = CreateZenCoreClient(clientConfig);
        else client = new ZenCoreClient();

        // check verification code (not now)

        const data = {
            uniqueCustomId: registerData.customUserId,
            password: registerData.passwd,
            email: registerData.email,
        } as RegisterRequest;

        data.uniqueCustomId = registerData.customUserId;
        return await client.auth.register(data);
    },
    registerAndLogin() {
        // todo later or never XD
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

            if (!result || (result as unknown as BasicResponse))
                throw new Error("Failed to refresh token");

            const newCredential = activeCredential;
            if (typeof result.accessTokenExpiresAt == 'string') {
                newCredential.AccessTokenExpiresAtTimestamp = Tools.dotnetDateParse(result.accessTokenExpiresAt).getTime();
            } else
                newCredential.AccessTokenExpiresAtTimestamp = result.accessTokenExpiresAt.getTime();

            newCredential.AccessToken = result.accessToken;

            AuthStoreMgrActs.flushCredential(newCredential, storageMethod);
            return newCredential;
        }
        else return activeCredential;
    },
    findPasswd() { // even not avaliable in backend...
        // todo later
    }, // fvck it. no longer wanted to write a find&login method
    async logoff(credential: Credential, storageMethod: (object: any) => any, clientConfig: ClientInitObject | undefined = undefined) {
        let client: ZenCoreClient;
        if (clientConfig) client = CreateZenCoreClient(clientConfig);
        else client = new ZenCoreClient();
        client.setAuthToken(credential.AccessToken);
        await client.auth.logout(credential.UsingDeviceId);
        AuthStoreMgrActs.clearCredential(credential, storageMethod);
    },
    logoffByUserId(userId: string, readMethod: () => Credential | Credential[], storageMethod: (object: any) => any, clientConfig: ClientInitObject | undefined = undefined) {
        const userCred = AuthStoreMgrActs.readCredential(readMethod, userId);
        let client: ZenCoreClient;
        if (clientConfig) client = CreateZenCoreClient(clientConfig);
        else client = new ZenCoreClient();
        client.setAuthToken(userCred.AccessToken);
        client.auth.logout(userCred.UsingDeviceId);
        // ... yebucihoule 
        AuthStoreMgrActs.clearCredential(userCred, storageMethod);
    },
    changeEmailAddress() {
        // todo later
        // not planned yet
    }

}

export const AuthStoreMgrActs = { // async???????????????????????????????????????????????????? or just dispatch????????
    readCredential(readMethod: () => Credential | Credential[], matchingUserId: string | undefined = undefined): Credential {
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
    flushCredential(credential: Credential, storageMethod: (object: any, wipe: boolean) => any) {
        storageMethod(credential, false); // aaaaaa how to!!!!!!!
    },
    clearCredential(credential: Credential, storageMethod: (object: any, wipe: boolean) => any) {
        storageMethod(credential, true); // aaaaaa how to!!!!!!!
    }
}
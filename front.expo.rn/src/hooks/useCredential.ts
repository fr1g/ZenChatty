import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/StoreProvider";
import { AuthState, ClientInitObject, CreateZenCoreClient, Credential, setUser, User } from "zen-core-chatty-ts";
import { Alert } from "react-native";
import { DefaultConfig } from "ZenClient.config";

export const useCredential = (): Credential | null => {
    const authState = useSelector((state: RootState) => state.auth);
    if (authState.isAuthenticated && authState.credential)
        return authState.credential;
    else return null;
};

export const useUserInfo = (): AuthInfo => {
    const authState = useSelector((state: RootState) => state.auth);
    const credential = useCredential();

    return {
        credential,
        isAuthenticated: authState.isAuthenticated,
        userGuid: credential?.UserGuid || null,
        deviceId: credential?.UsingDeviceId || null,
        isLoading: authState.isLoading,
        error: authState.error
    };
};

export const useCurrentUserGet = (selectedAuthState: AuthState, dispatch: Function) => {
    return async () => {
        const authState = selectedAuthState;
        let finalGot = authState.user;
        if (!finalGot && authState.credential) {
            let client = CreateZenCoreClient({
                ...DefaultConfig,
                userToken: authState.credential.AccessToken!,
            } as ClientInitObject);
            let userInfo: User | undefined = undefined;
            let possible;
            for (let i = 0; i < 3; i++) {
                try {
                    userInfo = await client!.auth.getUserInfo();
                    break;
                } catch (error) {
                    console.warn('Failed to get user info:', error, i);
                    possible = error;
                }
            }
            if (userInfo === undefined) {
                if(possible && (possible as Error))
                    Alert.alert("Login Invalid", "It may expired, please try to login again.");
                throw new Error("error on getting user info");
            }
            console.log('cached user info: ', userInfo);
            dispatch(setUser(userInfo));
        }
        return finalGot;
    }
};

export type AuthInfo = {
    credential: Credential | null;
    isAuthenticated: boolean;
    userGuid: string | null;
    deviceId: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Type definition for current user info
 */
export type CurrentUserInfo = ReturnType<typeof useCurrentUserGet>;

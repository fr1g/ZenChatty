import { useSelector } from "react-redux";
import { RootState } from "../redux/StoreProvider";
import { Credential } from "zen-core-chatty-ts";

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

export type AuthInfo = {
    credential: Credential | null;
    isAuthenticated: boolean;
    userGuid: string | null;
    deviceId: string | null;
    isLoading: boolean;
    error: string | null;
}
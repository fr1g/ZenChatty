import { View, Text, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Controller, useForm } from 'react-hook-form';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import ButtonSet, { ButtonItem } from "../../components/ButtonSet";
import { bg } from "../../class/shared/ConstBgStyles";
import { CoreRedux, LoginDataForm, LoginRequest, Credential, setUser, setCredential, CreateZenCoreClient } from "zen-core-chatty-ts";
import { RootState } from "../../redux/StoreProvider";
import { SQLiteStorageAdapter } from "../../database/SQLiteStorageAdapter";
import { ContextedClientConfig } from "../../App";
import * as Device from 'expo-device';

const { loginUser } = CoreRedux;

export default function Login() {
    const bottomInset = useSafeAreaInsets().bottom;
    
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className={`h-full flex flex-col-reverse`}
            keyboardVerticalOffset={bottomInset + 10}
        >
            <LoginMain bottomInset={bottomInset} />
        </KeyboardAvoidingView>
    );
}

function LoginMain({ bottomInset }: { bottomInset: number }) {
    const dispatch = useDispatch();
    const authState = useSelector((state: RootState) => state.auth);
    const clientConfig = useContext(ContextedClientConfig);
    const [deviceId, setDeviceId] = useState<string>('');
    
    // Get device unique identifier
    useEffect(() => {
        const getDeviceId = async () => {
            try {
                // Use expo-device to get device unique identifier
                const deviceId = Device.osBuildId || Device.modelId || Device.deviceName || Device.brand || 'unknown-device';
                setDeviceId(deviceId);
                console.log('Device ID:', deviceId);
            } catch (error) {
                console.error('Failed to get device ID:', error);
            }
        };
        
        getDeviceId();
    }, []);
    
    const {
        control,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm<LoginRequest>({
        defaultValues: {
            username: "",
            password: "",
        },
        mode: "all"
    });

    const onSubmit = async (data: LoginRequest) => {
        try {
            // Check if device ID has been obtained
            if (!deviceId) {
                Alert.alert('Device Info Error', 'Cannot get device info, please try again later');
                return;
            }
            
            // Create storage adapter instance, avoid duplicate creation
            const storageAdapter = new SQLiteStorageAdapter();
            
            // Create storage function for auto-saving credentials after SDK retrieves them
            const storageMethod = async (credential: any) => {
                try {
                    await storageAdapter.saveCredential({
                        user_guid: credential.user_guid || credential.UserGuid,
                        access_token: credential.access_token || credential.AccessToken,
                        refresh_token: credential.refresh_token || credential.RefreshToken,
                        root_token: credential.root_token || credential.RootToken,
                        using_device_id: credential.using_device_id || credential.UsingDeviceId,
                        expires_at: credential.expires_at ? new Date(credential.expires_at) : 
                                 credential.AccessTokenExpiresAtTimestamp ? new Date(credential.AccessTokenExpiresAtTimestamp) : undefined
                    });
                    console.log('Credential automatically saved by SDK storage method');
                } catch (error) {
                    console.warn('Failed to save credential via SDK storage method:', error);
                }
            };
            
            // LoginRequest => LoginDataForm
            const loginDataForm: LoginDataForm = {
                login: data.username!,  
                passwd: data.password!,  
                deviceId: deviceId 
            };
            
            const result 
                = await dispatch(loginUser({loginData: loginDataForm, clientConfig: clientConfig, storageMethod}) as any)
                .unwrap() as Credential;
            if(!result) throw new Error("invalid response");
            try {

                const zenCoreClient = CreateZenCoreClient({...clientConfig, userToken: result.AccessToken});
                
                // Call AuthApiClient.getUserInfo() to get user info
                const userInfo = await zenCoreClient.auth.getUserInfo();
                console.log('User info retrieved:', userInfo);
                // Cache user info to SQLite (using already created storageAdapter instance)
                await storageAdapter.cacheCurrentUserInfo(userInfo);
                console.log('User info cached to SQLite successfully');

                await dispatch(setUser(userInfo));
                
            } catch (cacheError: any) {
                console.warn('Failed to cache user info:', cacheError);
                // Cache failure doesn't affect login flow, only log warning
            }
        } catch (error: any) {
            console.error('Login error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response,
                status: error.status,
                backendResponse: error.backendResponse
            });
            
            // Prefer error message from backend response body
            const backendError = error.backendResponse;
            const errorMessage = backendError && typeof backendError === 'object'
                ? backendError.content || backendError.message || backendError.error || error.message
                : error.message || 'Unknown error';
            
            Alert.alert('Login Error', `Login failed: ${errorMessage}`);
        }
    }

    const [changed, setChanged] = useState(false);

    const buttons = [
        new ButtonItem("Login", handleSubmit(onSubmit), "", bg.emerald),
    ];

    return <View className="px-6 bg-zinc-300 shadow dark:bg-zinc-600 flex gap-3 rounded-t-2xl"
        style={{ paddingBottom: bottomInset * 2, paddingTop: bottomInset }}>
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">Email or UID</Text>
            <Controller
                control={control}
                rules={{
                    required: true,
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        className="bg-slate-400 w-full rounded-lg text-lg px-1.5"
                        placeholder="Who are you?"
                        onBlur={() => { setChanged(_ => !_); return onBlur }}
                        onChangeText={onChange}
                        value={value}
                    />
                )}
                name="username"
            />
            {errors.username && <Text>This is required.</Text>}
        </View>
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">Password</Text>
            <Controller
                control={control}
                rules={{
                    required: "Password is required",
                    pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-.=+_])[A-Za-z\d-.=+_]{8,18}$/,
                        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character (-.=+_), and be 8-18 characters long"
                    }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        className="bg-slate-400 w-full rounded-lg text-lg px-1.5"
                        placeholder="Password"
                        onBlur={() => { setChanged(_ => !_); return onBlur }}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry
                    />
                )}
                name="password"
            />
            {errors.password && <Text className="text-red-500">{errors.password.message as string}</Text>}
        </View>

        <ButtonSet buttons={buttons} />

    </View>
}
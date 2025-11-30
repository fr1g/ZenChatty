import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Controller, useForm } from 'react-hook-form';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ButtonSet, { ButtonItem } from "../../components/ButtonSet";
import { bg } from "../../class/shared/ConstBgStyles";
import { CoreRedux, LoginDataForm, LoginRequest, Credential, setUser, setCredential, CreateZenCoreClient } from "zen-core-chatty-ts";
import { RootState } from "../../redux/StoreProvider";
import { SQLiteStorageAdapter } from "../../database/SQLiteStorageAdapter";
import { ClientConfig } from "../../App";
import * as Device from 'expo-device';

const { loginUser } = CoreRedux;

export default function Login() {
    const bottomInset = useSafeAreaInsets().bottom;
    const [showingFindPassword, setShowingFindPassword] = useState(false);
    
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className={`h-full flex flex-col-reverse`}
            keyboardVerticalOffset={bottomInset + 10}
        >
            {!showingFindPassword ?
                <LoginMain switching={setShowingFindPassword} bottomInset={bottomInset} />
                :
                <FindPassword switching={setShowingFindPassword} bottomInset={bottomInset} />
            }
        </KeyboardAvoidingView>
    );
}

function LoginMain({ bottomInset, switching }: { bottomInset: number, switching: (val: boolean) => void }) {
    const dispatch = useDispatch();
    const authState = useSelector((state: RootState) => state.auth);
    const [deviceId, setDeviceId] = useState<string>('');
    
    // 获取设备唯一标识符
    useEffect(() => {
        const getDeviceId = async () => {
            try {
                // 使用expo-device获取设备唯一标识符
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

    // Watch passwd field for confirm password validation
    const password = watch('password');

    // Function to handle getting verification code
    const handleGetVerificationCode = () => {
        console.log('Getting verification code...');
        // Implementation for sending verification code would go here
    };

    const onSubmit = async (data: LoginRequest) => {
        try {
            // 检查设备ID是否已获取
            if (!deviceId) {
                Alert.alert('设备信息错误', '无法获取设备信息，请稍后重试');
                return;
            }
            
            // 创建存储适配器实例，避免重复创建
            const storageAdapter = new SQLiteStorageAdapter();
            
            // 创建存储函数，用于在SDK获取到Credential后自动存储
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
                = await dispatch(loginUser({loginData: loginDataForm, clientConfig: ClientConfig, storageMethod}) as any)
                .unwrap() as Credential;
            if(!result) throw new Error("invalid response");
            try {

                const zenCoreClient = CreateZenCoreClient({...ClientConfig, userToken: result.AccessToken});
                
                // 调用AuthApiClient.getUserInfo()获取用户信息
                const userInfo = await zenCoreClient.auth.getUserInfo();
                console.log('User info retrieved:', userInfo);
                // 缓存用户信息到SQLite（使用已创建的storageAdapter实例）
                await storageAdapter.cacheCurrentUserInfo(userInfo);
                console.log('User info cached to SQLite successfully');

                await dispatch(setUser(userInfo));
                
            } catch (cacheError: any) {
                console.warn('Failed to cache user info:', cacheError);
                // 缓存失败不影响登录流程，仅记录警告
            }
        } catch (error: any) {
            console.error('Login error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response,
                status: error.status,
                backendResponse: error.backendResponse
            });
            
            // 优先使用后端响应体中的错误信息
            const backendError = error.backendResponse;
            const errorMessage = backendError && typeof backendError === 'object'
                ? backendError.content || backendError.message || backendError.error || error.message
                : error.message || 'Unknown error';
            
            Alert.alert('Login Error', `Login failed: ${errorMessage}`);
        }
    }

    const [changed, setChanged] = useState(false);

    const buttons = [
        new ButtonItem("Forgot", () => switching(true), ""),
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

function FindPassword({ bottomInset, switching }: { bottomInset: number, switching: (val: boolean) => void }) {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            email: "",
            passwd: "",
            verificationCode: "",
            confirmPassword: "",
        },
        mode: "all"
    });
    const onSubmit = (data: any) => console.log(data);

    const handleGetVerificationCode = () => {
        console.log('Getting verification code...');
        // Implementation for sending verification code would go here
    };

    const [changed, setChanged] = useState(false);
    const buttons = [
        new ButtonItem("Login", () => switching(false), ""),
        new ButtonItem("Confirm", handleSubmit(onSubmit), "", bg.emerald),
    ];

    return <View className="px-6 bg-zinc-300 shadow dark:bg-zinc-600 flex gap-3 rounded-t-2xl"
        style={{ paddingBottom: bottomInset * 2, paddingTop: bottomInset }}>
        <Text className="dark:text-white text-black text-2xl align-middle text-center pt-1.5 py-3.5">
            Find Password

        </Text>
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">Email when you registered</Text>
            <Controller
                control={control}
                rules={{
                    required: "Email is required",
                    pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Please enter a valid email address"
                    }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        className="bg-slate-400 w-full rounded-lg text-lg px-1.5"
                        placeholder="Enter your registered email"
                        onBlur={() => { setChanged(_ => !_); return onBlur }}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                )}
                name="email"
            />
            {errors.email && <Text className="text-red-500">{errors.email.message as string}</Text>}
        </View>
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">Verification Code</Text>
            <View className="flex flex-row gap-2">
                <Controller
                    control={control}
                    rules={{
                        required: "Verification code is required",
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            className="bg-slate-400 flex-1 rounded-lg text-lg px-1.5"
                            placeholder="Enter code"
                            onBlur={() => { setChanged(_ => !_); return onBlur }}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="numeric"
                        />
                    )}
                    name="verificationCode"
                />
                <TouchableOpacity
                    onPress={handleGetVerificationCode}
                    className="bg-slate-400 rounded-lg px-4 justify-center"
                >
                    <Text className="text-center text-lg">Get Code</Text>
                </TouchableOpacity>
            </View>
            {errors.verificationCode && <Text className="text-red-500">{errors.verificationCode.message as string}</Text>}
        </View>
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">New Password</Text>
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
                name="passwd"
            />
            {errors.passwd && <Text className="text-red-500">{errors.passwd.message as string}</Text>}
        </View>
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">Confirm Password</Text>
            <Controller
                control={control}
                rules={{
                    required: "Confirm Password is required",
                    validate: (value, { passwd }) => value === passwd || "Passwords do not match"
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        className="bg-slate-400 w-full rounded-lg text-lg px-1.5"
                        placeholder="Confirm Password"
                        onBlur={() => { setChanged(_ => !_); return onBlur }}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry
                    />
                )}
                name="confirmPassword"
            />
            {errors.confirmPassword && <Text className="text-red-500">{errors.confirmPassword.message as string}</Text>}
        </View>
        <ButtonSet buttons={buttons} />
    </View>
}
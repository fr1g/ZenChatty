import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Controller, useForm } from 'react-hook-form';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ButtonSet, { ButtonItem } from "../../components/ButtonSet";
import { bg } from "../../class/shared/ConstBgStyles";
import { CoreRedux, LoginRequest } from "zen-core-chatty-ts";
import { RootState } from "../../redux/StoreProvider";
import zenCoreClient from "../../api/ZenCoreClientInstance";
import { SQLiteStorageAdapter } from "../../database/SQLiteStorageAdapter";

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
    
    const {
        control,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm<LoginRequest>({
        defaultValues: {
            email: "",
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
            const result = await dispatch(loginUser(data) as any).unwrap();
            
            if (result.success) {
                console.log('Login successful:', result);
                
                // 登录成功后，获取用户信息并缓存到SQLite
                try {
                    // 设置认证令牌
                    zenCoreClient.setAuthToken(result.credential?.token);
                    
                    // 调用AuthApiClient.getUserInfo()获取用户信息
                    const userInfo = await zenCoreClient.auth.getUserInfo();
                    console.log('User info retrieved:', userInfo);
                    
                    // 缓存用户信息到SQLite
                    const storageAdapter = new SQLiteStorageAdapter();
                    await storageAdapter.cacheCurrentUserInfo(userInfo);
                    console.log('User info cached to SQLite successfully');
                    
                } catch (cacheError: any) {
                    console.warn('Failed to cache user info:', cacheError);
                    // 缓存失败不影响登录流程，仅记录警告
                }
                
                // 登录成功，Redux 会自动更新状态，App.tsx 会检测到认证状态变化
            } else {
                Alert.alert('Login Failed', result.error || 'Unknown error occurred');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert('Login Error', error.message || 'An error occurred during login');
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
                name="email"
            />
            {errors.email && <Text>This is required.</Text>}
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
                name="email"
            />
            {errors.email && <Text>This is required.</Text>}
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
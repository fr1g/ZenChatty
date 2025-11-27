import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { KeyboardAvoidingView, Platform, View, TextInput, TouchableOpacity, Text, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import ButtonSet, { ButtonItem } from "../../components/ButtonSet";
import { bg } from "../../class/shared/ConstBgStyles";
import { CoreRedux, RegisterRequest, RegDataForm } from "zen-core-chatty-ts";
import { ClientConfig } from "../../App";

const { registerUser } = CoreRedux;


export default function Register() {
    const bottomInset = useSafeAreaInsets().bottom;
    const [isPassedToSecondStage, setIsPassedToSecondStage] = useState(false);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className={`h-full flex flex-col-reverse`}
            keyboardVerticalOffset={bottomInset}
        >
            {isPassedToSecondStage ?
                <SecondStage bottomInset={bottomInset} stageSetter={setIsPassedToSecondStage} /> :
                <RegisterMain bottomInset={bottomInset} stageSetter={setIsPassedToSecondStage} />
            }
        </KeyboardAvoidingView>
    );
}

function SecondStage({ bottomInset, stageSetter }: { bottomInset: number, stageSetter: (value: boolean) => void }) {
    return <View className="px-6 bg-zinc-300 shadow dark:bg-zinc-600 flex gap-3 rounded-t-2xl"
        style={{ paddingBottom: bottomInset * 2, paddingTop: bottomInset }}>
        <Text className="dark:text-white text-black text-xl align-middle">Second Stage</Text>
    </View>
}

function RegisterMain({ bottomInset, stageSetter }: { bottomInset: number, stageSetter: (value: boolean) => void }) {
    const dispatch = useDispatch();

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        trigger
    } = useForm<RegisterRequest & { confirmPassword: string, verificationCode: string }>({
        defaultValues: {
            uniqueCustomId: "",
            email: "",
            verificationCode: "",
            password: "",
            confirmPassword: ""
        },
        mode: "all"
    });

    // Function to handle getting verification code
    const handleGetVerificationCode = () => {
        console.log('Getting verification code...');
        // Implementation for sending verification code would go here
    };

    // Function to handle uid validation on input and blur
    const handleUidValidation = (value: string | undefined, onBlur: () => void) => {
        setChanged(_ => !_);
        // Trigger validation for uid field
        trigger('uniqueCustomId');
        // Call original onBlur if it exists
        if (onBlur) onBlur();
    };

    // Watch password field for confirm password validation
    const password = watch('password');

    // State for agreement checkbox
    const [isAgreed, setIsAgreed] = useState(false);

    const onSubmit = async (data: RegisterRequest & { confirmPassword: string, verificationCode: string }) => {
        if (!isAgreed) {
            Alert.alert('Agreement Required', 'Please agree to the terms and conditions');
            return;
        }

        try {
            const { confirmPassword, verificationCode, ...registerData } = data;
            // 修复字段映射：将 uniqueCustomId 映射到 customUserId
            const regDataForm: RegDataForm = {
                customUserId: registerData.uniqueCustomId,
                passwd: registerData.password || '',
                email: registerData.email || '',
                displayName: registerData.displayName || '',
                gender: registerData.gender || 0,
                birthday: registerData.birthday
            };
            const result = await dispatch(registerUser({registerData: regDataForm, clientConfig: ClientConfig}) as any).unwrap();

            if (result.success) {
                console.log('Registration successful:', result);
                Alert.alert('Registration Successful', 'Your account has been created successfully');
                // 注册成功，可以跳转到登录页面或其他操作
            } else {
                console.error('Registration failed with result:', result);
                // 优先显示后端返回的具体错误信息
                const errorMessage = result.error || 'Unknown error occurred. Please check console for details.';
                Alert.alert('Registration Failed', errorMessage);
            }
        } catch (error: any) {
            console.error('Registration error details:', {
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
                : error.message || `Unknown error: ${error}`;
            
            Alert.alert('Registration Error', `Registration failed: ${errorMessage}`);
        }
    };

    const buttons = [
        new ButtonItem("Cancel", () => stageSetter(false), "", { opacity: 0 }, true),
        new ButtonItem("Register", handleSubmit(onSubmit), "", bg.emerald),
    ];

    const [changed, setChanged] = useState(false);

    return <View className="px-6 bg-zinc-300 shadow dark:bg-zinc-600 flex gap-3 rounded-t-2xl"
        style={{ paddingBottom: bottomInset * 2, paddingTop: bottomInset }}>
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">UID (Required)</Text>
            <Controller
                control={control}
                rules={{
                    required: "UID is required",
                    pattern: {
                        value: /^[A-Za-z0-9]{6,12}$/,
                        message: "UID must be 6-12 characters long and contain only letters and numbers"
                    }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        className="bg-slate-400 w-full rounded-lg text-lg px-1.5"
                        placeholder="Enter your unique ID"
                        onBlur={() => handleUidValidation(value, onBlur)}
                        onChangeText={(text) => {
                            onChange(text);
                            handleUidValidation(text, onBlur);
                        }}
                        value={value}
                    />
                )}
                name="uniqueCustomId"
            />
            {errors.uniqueCustomId && <Text className="text-red-500">{errors.uniqueCustomId.message as string}</Text>}
        </View>
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">Email</Text>
            <Controller
                control={control}
                rules={{
                    required: true,
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        className="bg-slate-400 w-full rounded-lg text-lg px-1.5"
                        placeholder="This is vital"
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
            <Text className="dark:text-white text-black text-xl align-middle">Verification Code (Required)</Text>
            <View className="flex flex-row gap-2">
                <Controller
                    control={control}
                    rules={{
                        required: "Verification code is required",
                        pattern: {
                            value: /^[A-Za-z0-9]{0,6}$/,
                            message: "Verification code must be up to 6 characters long and contain only letters and numbers"
                        }
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            className="bg-slate-400 flex-1 rounded-lg text-lg px-1.5"
                            placeholder="Enter verification code"
                            onBlur={() => { setChanged(_ => !_); return onBlur }}
                            onChangeText={(text) => {
                                // Limit input to 6 characters
                                if (text.length <= 6) {
                                    onChange(text);
                                }
                            }}
                            value={value}
                            keyboardType="default"
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
        <View className="w-full">
            <Text className="dark:text-white text-black text-xl align-middle">Confirm Password</Text>
            <Controller
                control={control}
                rules={{
                    required: "Confirm Password is required",
                    validate: value => value === password || "Passwords do not match"
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
        <TouchableOpacity
            className="mr-2 w-full flex flex-row items-center pt-2"
            onPress={() => setIsAgreed(!isAgreed)}
        >
            <View
                className={`w-5 h-5 border-2 rounded ${isAgreed ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-400'}`}
            >
                {isAgreed && (
                    <Text className="text-white text-xs text-center -translate-y-px">✓</Text>
                )}
            </View>
            <Text className="dark:text-white text-black text-lg ml-3">I agree with the agreement</Text>
        </TouchableOpacity>

        <ButtonSet buttons={buttons} />
    </View>
}
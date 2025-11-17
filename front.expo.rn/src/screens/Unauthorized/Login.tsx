import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Controller, useForm } from 'react-hook-form';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import ButtonSet, { ButtonItem } from "../../components/ButtonSet";
import { bg } from "../../class/shared/ConstBgStyles";
import UserCredential from "../../class/UserCredential";


export default function Login({doLogin}: {doLogin: (afterJob: () => void, credential: UserCredential) => void}) {
    const bottomInset = useSafeAreaInsets().bottom;
    const [showingFindPassword, setShowingFindPassword] = useState(false);
    const login = (credential: UserCredential) => {
        doLogin(() => {}, credential);
    }
    return <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className={`h-full flex flex-col-reverse  `} 
            
            keyboardVerticalOffset={bottomInset + 10}
        >
            {!showingFindPassword ? 
                <LoginMain doLogin={login} switching={setShowingFindPassword} bottomInset={bottomInset} />
                :
                <FindPassword switching={setShowingFindPassword} bottomInset={bottomInset} />
            }
        </KeyboardAvoidingView>
}

function LoginMain({ doLogin, bottomInset, switching }: { doLogin: (credential: UserCredential) => void, bottomInset: number, switching: (val: boolean) => void}) {
    const {
        control,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm({
        defaultValues: {
            email: "",
            passwd: "",
        },
        mode: "all" 
    });
    
    // Watch passwd field for confirm password validation
    const passwd = watch('passwd');
    
    // Function to handle getting verification code
    const handleGetVerificationCode = () => {
        console.log('Getting verification code...');
        // Implementation for sending verification code would go here
    };
    const onSubmit = (data: any) => {
        const a = new UserCredential(data.email, data.passwd, '')
        console.log(a)
        doLogin(a);
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
                            onBlur={() => {setChanged(_ => !_); return onBlur}}
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
                            onBlur={() => {setChanged(_ => !_); return onBlur}}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry
                        />
                    )}
                    name="passwd"
                />
                {errors.passwd && <Text className="text-red-500">{errors.passwd.message as string}</Text>}
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
                            onBlur={() => {setChanged(_ => !_); return onBlur}}
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
                                onBlur={() => {setChanged(_ => !_); return onBlur}}
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
                            onBlur={() => {setChanged(_ => !_); return onBlur}}
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
                            onBlur={() => {setChanged(_ => !_); return onBlur}}
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
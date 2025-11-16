import { View, TouchableOpacity, Text, ViewStyle } from "react-native";

export default function ButtonSet({buttons} : {buttons: ButtonItem[]}) {
    return <View className="flex flex-row flex-wrap w-full gap-3 h-16 mt-3">
                {buttons.map((button, index) => (
                    <TouchableOpacity disabled={button.disabled} style={button.style} key={index} onPress={button.onPress} 
                        className={`rounded-xl h-full grow bg-slate-400 ${button.className}`}>
                        <Text className="text-center text-xl my-auto align-middle">{button.title}</Text>
                    </TouchableOpacity>
                ))}
            </View>
}

export class ButtonItem{
    title: string;
    onPress: () => void;
    className: string;
    style: ViewStyle;
    disabled: boolean;
    constructor(title: string, onPress: () => void, className: string = "", style: ViewStyle = {}, disabled: boolean = false) {
        this.title = title;
        this.onPress = onPress;
        this.className = className;
        this.style = style;
        this.disabled = disabled;
    }

}
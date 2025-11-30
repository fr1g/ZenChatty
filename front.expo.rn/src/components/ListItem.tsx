import { TouchableOpacity, View, Text } from "react-native";
import Avatar from "./Avatar";
import { DefaultAvatarUrl } from "zen-core-chatty-ts";
import { ReactNode } from "react";

export default function ListItem({ item }: { item: ListItemProps }) {

    return <TouchableOpacity className='h-20 relative flex-row items-center border-b border-b-zinc-300 dark:border-b-zinc-700'>
        <View className="relative">
            <View style={{
                position: 'absolute',
                top: 20,
                right: 8,
                backgroundColor: item.hightlight ? '#fecacafa' : '#aeaeaeaa',
                borderRadius: 999,
                padding: 3,
                display: item.topBadge == "" ? "none" : undefined,
                minWidth: 24,
                zIndex: 10
            }}>
                <Text className="text-center">{item.topBadge}</Text>
            </View>
            <Avatar path={item.avatarUrl} />
        </View>
        <View className='grow ' style={{ width: "50%" }}>
            <Text className='text-xl' >{item.title}</Text>
            <Text 
                style={{
                    // maxHeight: 36,
                    maxWidth: "86%"
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
                className='-translate-y-0.5 opacity-80  '>
                {item.subtitle} ahisudhiahsuidhihsaiuhdiuh
            </Text>
        </View>
    </TouchableOpacity>
}

export class ListItemProps {
    avatarUrl: string = DefaultAvatarUrl;
    title: string = "No Title";
    subtitle: string = "No Subtitle";
    topBadge?: string;
    bottomBadge?: string;
    CIA?: ReactNode;
    cornerTip?: Date | string;
    hightlight?: boolean
}
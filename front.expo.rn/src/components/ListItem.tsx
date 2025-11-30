import { TouchableOpacity, View, Text } from "react-native";
import Avatar from "./Avatar";
import { DefaultAvatarUrl } from "zen-core-chatty-ts";
import { ReactNode } from "react";

export default function ListItem({item} : {item: ListItemProps}) {

    return <TouchableOpacity className='h-20 relative flex-row items-center border-b border-b-zinc-300 dark:border-b-zinc-700'>
        <Avatar path={item.avatarUrl} />
        <View className='grow '>
            <Text className='text-xl' >{item.title}</Text>
            <Text className='-translate-y-0.5 opacity-80'>{item.subtitle}</Text>
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
}
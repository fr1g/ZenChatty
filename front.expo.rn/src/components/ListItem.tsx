import { TouchableOpacity, View, Text } from "react-native";
import Avatar from "./Avatar";
import { DefaultAvatarUrl } from "zen-core-chatty-ts";
import { ReactNode } from "react";

export default function ListItem({ item, onPress, onLongPress }: { item: ListItemProps, onPress?: () => void, onLongPress?: () => void }) {
    const Container = (onPress || onLongPress) ? TouchableOpacity : View;

    return <Container 
    style={{height: 86}}
    onPress={onPress}
    onLongPress={onLongPress}
    delayLongPress={500}
    className=' relative flex-row items-center border-b border-b-zinc-300 dark:border-b-zinc-700'>
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
                {item.subtitle} 
            </Text>
        </View>
    </Container>
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
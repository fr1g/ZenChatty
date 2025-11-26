import { useEffect, useState } from 'react';
import { Chat } from "zen-core-chatty-typescript"
import { Text } from 'react-native';

export default function ShortRecentMsgView({ chat }: { chat: Chat }) {
    const [latest, setLatest] = useState("- no msg -");
    useEffect(() => {

    }, [])
    return (
        <Text className='-translate-y-0.5'>{latest}</Text>
    );
}

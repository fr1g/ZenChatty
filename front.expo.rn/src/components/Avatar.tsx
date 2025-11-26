import { getImgByLocator } from '../class/helpers/FileRequest';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image } from 'react-native';

export default function Avatar({ locator }: { locator: string }) {
    const [base64, setBase64] = useState('');
    useEffect(() => {
        if (locator === '') getImgByLocator('').then(setBase64);
    }, [])
    useEffect(() => {
        if (locator === '') return;
        getImgByLocator(locator).then(setBase64);
    }, [locator]);
    return !base64 ? (
        <ActivityIndicator
            style={{
                height: '100%',
                aspectRatio: 1,
            }}
            size="small"
        />
    ) : (
        <Image
            source={{ uri: `data:image/png;base64,${base64}` }}
            style={{
                height: '100%',
                aspectRatio: 1,
                borderRadius: 999, // 圆形头像
            }}
            resizeMode="cover"
        />

    );
}
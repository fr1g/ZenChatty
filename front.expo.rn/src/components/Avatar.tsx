import { getImgByLocator } from '../class/helpers/FileRequest';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';

export default function Avatar({ path }: { path: string }) {

    return path === '' ? (
        <ActivityIndicator
            style={{
                height: '86%',
                aspectRatio: 1,
            }}
            size="small"
        />
    ) : (
        <Image
            source={{ uri: path }}
            style={{
                height: '86%',
                aspectRatio: 1,
                borderRadius: 999, 
                marginVertical: 20,
                marginHorizontal: 12,
                padding: 15
            }}
        />

    );
}
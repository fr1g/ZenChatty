import React from 'react';
import { View, Text } from 'react-native';
import { useCurrentUser } from './useCredential';

/**
 * 使用示例：在组件中使用useCurrentUser hook
 */
const UserProfile: React.FC = () => {
    const {
        // 认证状态
        isAuthenticated,
        isLoading,
        error,
        
        // 凭据信息
        credential,
        accessToken,
        refreshToken,
        
        // 设备信息
        deviceId,
        userGuid,
        
        // 用户详细信息
        userInfo,
        
        // 便捷方法
        hasValidToken,
        getUsername,
        getDisplayName,
        getAvatarUrl,
        
        // 状态检查
        isLoggedIn,
        hasError,
        isReady
    } = useCurrentUser();

    // 加载状态
    if (isLoading) {
        return (
            <View>
                <Text>正在加载用户信息...</Text>
            </View>
        );
    }

    // 错误状态
    if (hasError) {
        return (
            <View>
                <Text style={{ color: 'red' }}>错误: {error}</Text>
            </View>
        );
    }

    // 未登录状态
    if (!isLoggedIn) {
        return (
            <View>
                <Text>请先登录</Text>
            </View>
        );
    }

    // 已登录状态 - 显示用户信息
    return (
        <View>
            <Text>用户信息</Text>
            <Text>用户名: {getUsername() || '未知'}</Text>
            <Text>显示名称: {getDisplayName() || '未知'}</Text>
            <Text>头像: {getAvatarUrl() ? '已设置' : '未设置'}</Text>
            <Text>用户GUID: {userGuid}</Text>
            <Text>设备ID: {deviceId}</Text>
            <Text>Token状态: {hasValidToken() ? '有效' : '无效'}</Text>
            <Text>应用状态: {isReady ? '就绪' : '未就绪'}</Text>
        </View>
    );
};

export default UserProfile;

/**
 * 另一个使用示例：在API调用中使用deviceId
 */
const ApiCallExample: React.FC = () => {
    const { deviceId, userGuid, isLoggedIn } = useCurrentUser();

    const makeApiCall = async () => {
        if (!isLoggedIn) {
            console.log('请先登录');
            return;
        }

        // 在API调用中使用deviceId
        const requestData = {
            userId: userGuid,
            deviceId: deviceId,
            // ...其他参数
        };

        // 调用API
        // await apiCall(requestData);
    };

    return (
        <View>
            <Text>API调用示例</Text>
            {/* 调用API的按钮 */}
        </View>
    );
};

/**
 * 条件渲染示例
 */
const ConditionalRenderingExample: React.FC = () => {
    const { isLoggedIn, getDisplayName } = useCurrentUser();

    return (
        <View>
            {isLoggedIn ? (
                <Text>欢迎回来，{getDisplayName()}！</Text>
            ) : (
                <Text>请登录以继续</Text>
            )}
        </View>
    );
};
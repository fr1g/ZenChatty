import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CreateZenCoreClient, EGender, UserInfoQueryRequest, UserInfoResponse } from 'zen-core-chatty-ts';
import { useCredential } from 'hooks/useCredential';
import { ClientConfig } from 'App';

export default function UserSearchScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<UserInfoResponse | null>(null);
    const credential = useCredential();
    const [c, setC] = useState("");

    useEffect(() => {
        setC(`${credential?.AccessToken}`);
    }, [])

    const handleSearch = async () => {
        if (!email) {
            Alert.alert('错误', '请输入邮箱或用户ID进行搜索');
            return;
        }

        setLoading(true);
        setSearchResult(null);

        try {
            const client = CreateZenCoreClient({
                ...ClientConfig,
                userToken: credential?.AccessToken!
            })

            // 调用SDK中的用户API方法
            const result: UserInfoResponse = await client.contact.queryUserInfo(email);
            setSearchResult(result);

            if (!result.success) {
                Alert.alert('搜索失败', result.message || '未知错误');
            }
        } catch (error) {
            console.error('搜索用户失败:', error);
            Alert.alert('错误', '网络请求失败，请检查网络连接');
            setSearchResult({
                localId: '',
                status: 0,
                gender: EGender.Unset,
                registeredAt: new Date(),
                success: false,
                message: '网络请求失败'
            });
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setEmail('');
        setSearchResult(null);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>Easy AddFriend</Text>

            <View style={styles.searchForm}>
                <View style={styles.inputContainer}>
                    <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="email or username"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.clearButton]}
                        onPress={clearSearch}
                        disabled={loading}
                    >
                        <Feather name="x" size={16} color="#666" />
                        <Text style={styles.clearButtonText}>清空</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.searchButton]}
                        onPress={handleSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Feather name="search" size={16} color="#fff" />
                        )}
                        <Text style={styles.searchButtonText}>
                            {loading ? 'Looking...' : 'Find User'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 搜索结果 */}
            {searchResult && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultTitle}>
                        {searchResult.success ? 'Result' : 'Failed'}
                    </Text>

                    {searchResult.success ? (
                        <View style={styles.userInfo}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>用户ID:</Text>
                                <Text style={styles.infoValue}>{searchResult.localId || 'None'}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>显示名称:</Text>
                                <Text style={styles.infoValue}>{searchResult.displayName || 'None'}</Text>
                            </View>

                            {searchResult.customId && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>ID:</Text>
                                    <Text style={styles.infoValue}>{searchResult.customId}</Text>
                                </View>
                            )}

                            {searchResult.email && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>EMail:</Text>
                                    <Text style={styles.infoValue}>{searchResult.email}</Text>
                                </View>
                            )}

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Status:</Text>
                                <Text style={styles.infoValue}>{searchResult.status || 'Wrong: No Value Resp.'}</Text>
                            </View>

                            {searchResult.bio && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Bio:</Text>
                                    <Text style={styles.infoValue}>{searchResult.bio}</Text>
                                </View>
                            )}

                            {/* 预留功能按钮 */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Feather name="user-plus" size={16} color="#007AFF" />
                                    <Text style={styles.actionButtonText}>添加好友</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.errorText}>{searchResult.message}</Text>
                    )}
                </View>
            )}

            <Text>
                {c}
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    searchForm: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 12,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
    },
    clearButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchButton: {
        backgroundColor: '#007AFF',
    },
    clearButtonText: {
        marginLeft: 5,
        color: '#666',
        fontWeight: '600',
    },
    searchButtonText: {
        marginLeft: 5,
        color: '#fff',
        fontWeight: '600',
    },
    resultContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    userInfo: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        minWidth: 80,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        textAlign: 'right',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: '#f8f9fa',
    },
    actionButtonText: {
        marginLeft: 5,
        color: '#007AFF',
        fontSize: 12,
        fontWeight: '500',
    },
});
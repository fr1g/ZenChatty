import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CreateZenCoreClient, EGender, UserInfoResponse } from 'zen-core-chatty-ts';
import { useCredential } from 'hooks/useCredential';
import { ContextedClientConfig } from 'App';
import { useSelector } from 'react-redux';
import { RootState } from 'zen-core-chatty-ts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserSearchScreen({ navigation }: any) {
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<UserInfoResponse | null>(null);
    const [sendingRequest, setSendingRequest] = useState(false);
    const credential = useCredential();
    const clientConfig = useContext(ContextedClientConfig);
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const insets = useSafeAreaInsets();

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleSearch = async () => {
        if (!searchText.trim()) {
            Alert.alert('Notice', 'Please enter user ID or email');
            return;
        }

        setLoading(true);
        setSearchResult(null);

        try {
            const client = CreateZenCoreClient({
                ...clientConfig,
                userToken: credential?.AccessToken!
            });

            const result: UserInfoResponse = await client.contact.queryOthersInfoByPrivacy(searchText.trim());
            setSearchResult(result);

            if (!result.success) {
                // Don't show popup, display directly on screen
            }
        } catch (error) {
            console.error('Failed to search user:', error);
            setSearchResult({
                localId: '',
                status: 0,
                gender: EGender.Unset,
                registeredAt: new Date(),
                success: false,
                message: 'Network request failed, please check your connection'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async () => {
        if (!searchResult || !searchResult.localId) {
            return;
        }

        if (searchResult.localId === currentUser?.localId) {
            Alert.alert('Notice', 'Cannot add yourself as a friend');
            return;
        }

        setSendingRequest(true);

        try {
            const client = CreateZenCoreClient({
                ...clientConfig,
                userToken: credential?.AccessToken!
            });

            const result = await client.contact.sendFriendRequest(searchResult.localId);

            if (result.success) {
                Alert.alert('Sent Successfully', 'Friend request sent, waiting for verification', [
                    {
                        text: 'OK',
                        onPress: () => {
                            setSearchText('');
                            setSearchResult(null);
                        }
                    }
                ]);
            } else {
                Alert.alert('Send Failed', result.content || 'Please try again later');
            }
        } catch (error: any) {
            console.error('Failed to send friend request:', error);
            Alert.alert('Error', error.message || 'Network request failed');
        } finally {
            setSendingRequest(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Top navigation bar */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={handleGoBack}
                    activeOpacity={0.6}
                >
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Friend</Text>
                <View style={styles.headerRight} />
            </View>

            <KeyboardAvoidingView 
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Search box */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Feather name="search" size={18} color="#888" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="User ID / Email"
                                placeholderTextColor="#999"
                                value={searchText}
                                onChangeText={setSearchText}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="search"
                                onSubmitEditing={handleSearch}
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity 
                                    onPress={() => {
                                        setSearchText('');
                                        setSearchResult(null);
                                    }}
                                    style={styles.clearButton}
                                >
                                    <Feather name="x-circle" size={18} color="#C7C7CC" />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <TouchableOpacity
                            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
                            onPress={handleSearch}
                            disabled={loading || !searchText.trim()}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.searchButtonText}>Search</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Hint text */}
                    {!searchResult && !loading && (
                        <View style={styles.hintSection}>
                            <Feather name="users" size={48} color="#C7C7CC" />
                            <Text style={styles.hintText}>Enter user ID or email to search</Text>
                        </View>
                    )}

                    {/* Search results */}
                    {searchResult && (
                        <View style={styles.resultSection}>
                            {searchResult.success ? (
                                <View style={styles.userCard}>
                                    {/* User avatar */}
                                    <View style={styles.userAvatar}>
                                        <Text style={styles.userAvatarText}>
                                            {(searchResult.displayName || searchResult.customId || '?').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    
                                    {/* User info */}
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>
                                            {searchResult.displayName || searchResult.customId || 'Unknown User'}
                                        </Text>
                                        {searchResult.customId && (
                                            <Text style={styles.userId}>ID: {searchResult.customId}</Text>
                                        )}
                                        {searchResult.bio && (
                                            <Text style={styles.userBio} numberOfLines={2}>
                                                {searchResult.bio}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Add button */}
                                    <TouchableOpacity
                                        style={[styles.addButton, sendingRequest && styles.addButtonDisabled]}
                                        onPress={handleAddFriend}
                                        disabled={sendingRequest}
                                        activeOpacity={0.7}
                                    >
                                        {sendingRequest ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.addButtonText}>Add</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.notFoundCard}>
                                    <Feather name="user-x" size={40} color="#C7C7CC" />
                                    <Text style={styles.notFoundText}>
                                        {searchResult.message || 'User not found'}
                                    </Text>
                                    <Text style={styles.notFoundHint}>
                                        Please check if the ID or email is correct
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EDEDED',
    },
    
    // Top navigation bar
    header: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        marginRight: 28, // Balance the back button width
    },
    headerRight: {
        width: 28,
    },
    
    content: {
        flex: 1,
    },
    
    // Search area
    searchSection: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 36,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#000',
        marginLeft: 8,
        padding: 0,
    },
    clearButton: {
        padding: 2,
    },
    searchButton: {
        backgroundColor: '#07C160',
        paddingHorizontal: 16,
        height: 36,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonDisabled: {
        backgroundColor: '#A8E6CF',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    
    // Hint area
    hintSection: {
        alignItems: 'center',
        paddingTop: 80,
    },
    hintText: {
        marginTop: 16,
        fontSize: 14,
        color: '#888',
    },
    
    // Search results
    resultSection: {
        marginTop: 12,
        marginHorizontal: 16,
    },
    
    // User card
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: '#07C160',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#fff',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    userId: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    userBio: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#07C160',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addButtonDisabled: {
        backgroundColor: '#A8E6CF',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    
    // Not found card
    notFoundCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 32,
        alignItems: 'center',
    },
    notFoundText: {
        marginTop: 16,
        fontSize: 15,
        color: '#333',
    },
    notFoundHint: {
        marginTop: 8,
        fontSize: 13,
        color: '#888',
    },
});

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { View, Text } from 'react-native';
import { store, RootState, AppDispatch } from 'zen-core-chatty-ts';
import { initializeStorage } from './storageAdapter';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      try {
        await initializeStorage();
        setIsStorageInitialized(true);
        console.log('存储适配器初始化完成');
      } catch (error) {
        console.error('存储适配器初始化失败:', error);
        // to be updated: critical error: the storage is the lifeline 
        setIsStorageInitialized(true);
      }
    };

    initStorage();
  }, []);

  if (!isStorageInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return <Provider store={store}>{children}</Provider>;
};

export { store, RootState, AppDispatch };
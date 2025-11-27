import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from 'zen-core-chatty-ts';
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
        // 即使初始化失败，也继续渲染应用
        setIsStorageInitialized(true);
      }
    };

    initStorage();
  }, []);

  // 如果存储适配器尚未初始化，可以显示加载状态
  if (!isStorageInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>正在初始化存储系统...</div>
      </div>
    );
  }

  return <Provider store={store}>{children}</Provider>;
};

export { store };
export type { RootState, AppDispatch } from 'zen-core-chatty-ts';
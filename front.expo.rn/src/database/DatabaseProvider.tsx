import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { DatabaseManager } from './DatabaseManager';

interface DatabaseContextType {
  isInitialized: boolean;
  databaseManager: DatabaseManager;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const databaseManager = DatabaseManager.getInstance();

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Initializing SQLite database...');
        await databaseManager.initializeDatabase();
        setIsInitialized(true);
        console.log('SQLite database initialized successfully');
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    initializeDatabase();

    // 清理函数
    return () => {
      if (databaseManager.isInitialized()) {
        databaseManager.closeDatabase().catch(console.error);
      }
    };
  }, [databaseManager]);

  const value: DatabaseContextType = {
    isInitialized,
    databaseManager,
    error
  };

  if (error) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Database Initialization Error</Text>
        <Text style={{ marginBottom: 10 }}>{error}</Text>
        <Text>Please restart the application.</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Initializing Database...</Text>
        <Text>Please wait while we set up the database.</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const useDatabaseManager = (): DatabaseManager => {
  const context = useDatabase();
  return context.databaseManager;
};
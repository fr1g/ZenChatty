import React, { createContext, useContext, useEffect, useState } from 'react';
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
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Database Initialization Error</h2>
        <p>{error}</p>
        <p>Please restart the application.</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Initializing Database...</h2>
        <p>Please wait while we set up the database.</p>
      </div>
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
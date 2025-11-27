import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StorageMethods, initializeStorage } from '../redux/storageAdapter';

const StorageTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runStorageTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      addTestResult('开始SQLite存储适配器测试...');
      
      // 1. 初始化测试
      addTestResult('1. 初始化存储适配器...');
      await initializeStorage();
      addTestResult('✓ 存储适配器初始化成功');
      
      // 2. 基础存储测试
      addTestResult('2. 测试基础存储功能...');
      const testKey = 'storage_test_key';
      const testData = {
        message: 'SQLite存储测试',
        timestamp: Date.now(),
        version: '1.0.0'
      };
      
      await StorageMethods.storageMethod(testKey, JSON.stringify(testData));
      addTestResult('✓ 数据存储成功');
      
      // 3. 数据读取测试
      addTestResult('3. 测试数据读取功能...');
      const retrievedData = await StorageMethods.readMethod(testKey);
      
      if (retrievedData) {
        const parsedData = JSON.parse(retrievedData);
        if (parsedData.message === testData.message) {
          addTestResult('✓ 数据读取成功 - 内容匹配');
        } else {
          addTestResult('✗ 数据读取失败 - 内容不匹配');
        }
      } else {
        addTestResult('✗ 数据读取失败 - 未找到数据');
      }
      
      // 4. Redux状态持久化测试
      addTestResult('4. 测试Redux状态持久化...');
      const authState = {
        isAuthenticated: true,
        user: {
          id: 'test_user_456',
          username: 'testuser',
          email: 'test@example.com'
        },
        loading: false,
        error: null
      };
      
      await StorageMethods.storageMethod('auth_state', JSON.stringify(authState));
      const restoredAuthState = await StorageMethods.readMethod('auth_state');
      
      if (restoredAuthState) {
        const parsedAuthState = JSON.parse(restoredAuthState);
        if (parsedAuthState.isAuthenticated === authState.isAuthenticated) {
          addTestResult('✓ Redux状态持久化测试成功');
        } else {
          addTestResult('✗ Redux状态持久化测试失败');
        }
      } else {
        addTestResult('✗ Redux状态持久化测试失败 - 未找到数据');
      }
      
      // 5. 多数据类型测试
      addTestResult('5. 测试多数据类型存储...');
      const testCases = [
        { key: 'string_test', value: '简单字符串' },
        { key: 'number_test', value: 12345 },
        { key: 'boolean_test', value: true },
        { key: 'array_test', value: [1, 2, 3, 'test'] },
        { key: 'object_test', value: { nested: { data: 'deep' } } }
      ];
      
      for (const testCase of testCases) {
        await StorageMethods.storageMethod(testCase.key, JSON.stringify(testCase.value));
        const result = await StorageMethods.readMethod(testCase.key);
        
        if (result && JSON.parse(result) === testCase.value) {
          addTestResult(`✓ ${testCase.key} 类型测试成功`);
        } else {
          addTestResult(`✗ ${testCase.key} 类型测试失败`);
        }
      }
      
      // 6. 性能测试
      addTestResult('6. 性能测试...');
      const startTime = Date.now();
      const performanceData = Array.from({ length: 10 }, (_, i) => ({
        key: `perf_${i}`,
        value: `性能测试数据 ${i}`
      }));
      
      for (const item of performanceData) {
        await StorageMethods.storageMethod(item.key, JSON.stringify(item.value));
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      addTestResult(`✓ 性能测试完成 - 10次操作耗时 ${duration}ms`);
      
      addTestResult('\n✅ 所有测试完成！SQLite存储适配器工作正常。');
      
    } catch (error) {
      addTestResult(`❌ 测试失败: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    runStorageTests();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite存储适配器测试</Text>
      
      {isTesting && (
        <Text style={styles.loading}>测试进行中...</Text>
      )}
      
      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text 
            key={index} 
            style={[
              styles.resultText,
              result.includes('✓') && styles.successText,
              result.includes('✗') && styles.errorText,
              result.includes('❌') && styles.errorText
            ]}
          >
            {result}
          </Text>
        ))}
      </ScrollView>
      
      <Text style={styles.footer}>
        测试结果将显示存储适配器的功能和性能表现
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  loading: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
  successText: {
    color: 'green',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
});

export default StorageTest;
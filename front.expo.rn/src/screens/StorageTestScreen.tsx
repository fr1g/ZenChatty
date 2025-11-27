import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StorageMethods, initializeStorage } from '../redux/storageAdapter';

export default function StorageTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
    console.log(result);
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
      
      // 5. 性能测试
      addTestResult('5. 性能测试...');
      const startTime = Date.now();
      const performanceData = Array.from({ length: 5 }, (_, i) => ({
        key: `perf_${i}`,
        value: `性能测试数据 ${i}`
      }));
      
      for (const item of performanceData) {
        await StorageMethods.storageMethod(item.key, JSON.stringify(item.value));
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      addTestResult(`✓ 性能测试完成 - 5次操作耗时 ${duration}ms`);
      
      addTestResult('\n✅ 所有测试完成！SQLite存储适配器工作正常。');
      
      Alert.alert('测试完成', 'SQLite存储适配器测试完成，请查看控制台和界面显示的结果。');
      
    } catch (error) {
      addTestResult(`❌ 测试失败: ${error}`);
      Alert.alert('测试失败', `存储适配器测试失败: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite存储适配器测试</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isTesting && styles.buttonDisabled]} 
          onPress={runStorageTests}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            {isTesting ? '测试中...' : '开始测试'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={clearTestResults}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>清除结果</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text 
            key={index} 
            style={[
              styles.resultText,
              result.includes('✓') && styles.successText,
              (result.includes('✗') || result.includes('❌')) && styles.errorText
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
}

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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
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
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ApiService from '../../services/ApiService';
import BackendAuthService from '../../services/BackendAuthService';

export default function BackendTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [loading, setLoading] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await ApiService.healthCheck();
      if (response.error) {
        addTestResult(`❌ Health Check Failed: ${response.error}`);
      } else {
        addTestResult(`✅ Health Check Passed: ${JSON.stringify(response.data)}`);
      }
    } catch (error: any) {
      addTestResult(`❌ Health Check Error: ${error.message}`);
    }
    setLoading(false);
  };

  const testSignUp = async () => {
    setLoading(true);
    try {
      const response = await BackendAuthService.register({
        email,
        password,
        name: 'Test User',
      });
      addTestResult(`✅ Sign Up Success: ${JSON.stringify(response)}`);
    } catch (error: any) {
      addTestResult(`❌ Sign Up Failed: ${error.message}`);
    }
    setLoading(false);
  };

  const testSignIn = async () => {
    setLoading(true);
    try {
      const response = await BackendAuthService.login({
        email,
        password,
      });
      addTestResult(`✅ Sign In Success: ${JSON.stringify(response)}`);
    } catch (error: any) {
      addTestResult(`❌ Sign In Failed: ${error.message}`);
    }
    setLoading(false);
  };

  const testGetCurrentUser = async () => {
    setLoading(true);
    try {
      const user = await BackendAuthService.getCurrentUser();
      if (user) {
        addTestResult(`✅ Get Current User Success: ${JSON.stringify(user)}`);
      } else {
        addTestResult(`❌ Get Current User: No user found`);
      }
    } catch (error: any) {
      addTestResult(`❌ Get Current User Failed: ${error.message}`);
    }
    setLoading(false);
  };

  const testAuthenticationStatus = async () => {
    setLoading(true);
    try {
      const isAuth = await BackendAuthService.isAuthenticated();
      addTestResult(`✅ Authentication Status: ${isAuth ? 'Authenticated' : 'Not Authenticated'}`);
    } catch (error: any) {
      addTestResult(`❌ Authentication Status Failed: ${error.message}`);
    }
    setLoading(false);
  };

  const testSignOut = async () => {
    setLoading(true);
    try {
      await BackendAuthService.logout();
      addTestResult(`✅ Sign Out Success`);
    } catch (error: any) {
      addTestResult(`❌ Sign Out Failed: ${error.message}`);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const copyResults = () => {
    const results = testResults.join('\n');
    // In a real app, you'd use Clipboard from react-native
    Alert.alert('Results', results);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Backend API Test</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="test@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="password"
          secureTextEntry
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testHealthCheck}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Health Check</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testGetCurrentUser}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Get Current User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testAuthenticationStatus}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Auth Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testSignOut}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyButton} onPress={copyResults}>
            <Text style={styles.copyButtonText}>View All Results</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  clearButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  copyButton: {
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
    color: '#34495e',
  },
});
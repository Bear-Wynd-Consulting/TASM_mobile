import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE_NAME = 'com.scholarchatmobile.geminiapikey';

const SettingsScreen: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoading(true);
      try {
        const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE_NAME });
        if (credentials) {
          setApiKey(credentials.password);
        }
      } catch (error) {
        console.error('Failed to load API key:', error);
        Alert.alert('Error', 'Failed to load API key.');
      } finally {
        setIsLoading(false);
      }
    };
    loadApiKey();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Validation', 'API key cannot be empty.');
      return;
    }
    setIsLoading(true);
    try {
      await Keychain.setGenericPassword(KEYCHAIN_SERVICE_NAME, apiKey, { service: KEYCHAIN_SERVICE_NAME });
      Alert.alert('Success', 'API key saved securely.');
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('Error', 'Failed to save API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetApiKey = async () => {
    setIsLoading(true);
    try {
      const success = await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE_NAME });
      if (success) {
        setApiKey('');
        Alert.alert('Success', 'API key reset.');
      } else {
        Alert.alert('Error', 'Failed to reset API key or no key was set.');
      }
    } catch (error) {
      console.error('Failed to reset API key:', error);
      Alert.alert('Error', 'An error occurred while resetting the API key.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && !apiKey && !isLoading) { // Check isLoading first
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#6200ee"/>
        <Text>Loading API Key...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gemini API Key</Text>
      <Text style={styles.label}>Enter your Gemini API Key:</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Your Gemini API Key"
        secureTextEntry
        editable={!isLoading}
      />
      <View style={styles.buttonContainer}>
        <Button title="Save Key" onPress={handleSaveApiKey} disabled={isLoading || !apiKey.trim()} color="#6200ee" />
      </View>
      {apiKey ? (
         <View style={styles.buttonContainer}>
            <Button title="Reset Key" onPress={handleResetApiKey} disabled={isLoading} color="#f44336" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20, alignItems: 'center', backgroundColor: '#f5f5f5' }, // justifyContent removed for top alignment
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  label: { fontSize: 16, color: '#555', alignSelf: 'flex-start', marginBottom: 8, marginLeft: '5%' }, // Added margin for alignment
  input: { width: '90%', borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 25, borderRadius: 5, backgroundColor: '#fff', fontSize: 16 },
  buttonContainer: { width: '90%', marginTop: 12, borderRadius: 8, overflow: 'hidden' },
});
export default SettingsScreen;

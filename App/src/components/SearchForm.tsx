import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';

interface SearchFormProps { onSearch: (query: string) => void; isLoading: boolean; initialQuery?: string; }

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading, initialQuery = '' }) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const handleSearch = () => { Keyboard.dismiss(); if (query.trim()) onSearch(query.trim()); };
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your research query..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        editable={!isLoading}
      />
      {isLoading ? <ActivityIndicator size="small" color="#6200ee" style={styles.activityIndicator} />
                 : <Button title="Search" onPress={handleSearch} disabled={!query.trim()} color="#6200ee" />}
    </View>
  );
};
const styles = StyleSheet.create({
  container: { padding: 10, backgroundColor: '#fff', borderRadius: 8, elevation: 2, marginBottom: 10 },
  input: { height: 45, borderColor: '#ddd', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, marginBottom: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  activityIndicator: { height: 36, justifyContent: 'center', alignItems: 'center' }
});
export default SearchForm;

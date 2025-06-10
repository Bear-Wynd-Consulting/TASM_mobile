import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { StackNavigationProp } from '@react-navigation/stack'; // Import StackNavigationProp
import * as AppFirebase from '../lib/firebase';
import SearchForm from '../components/SearchForm';
import ArticleCard, { Article } from '../components/ArticleCard';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as Keychain from 'react-native-keychain'; // For API Key

const KEYCHAIN_SERVICE_NAME = 'com.scholarchatmobile.geminiapikey'; // Ensure this matches SettingsScreen

interface SearchActionResultBackend { // Renamed to avoid conflict with Article type
  naturalLanguageQuery?: string;
  translatedQuery?: string;
  googleScholarSearchLink?: string;
  articles: Article[]; // Uses the Article type from ArticleCard.tsx
  error?: string;
}
interface SummarizeAllResultBackend {
    overallSummary?: string;
    updatedArticles: Article[];
    error?: string;
}

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface SearchState {
  naturalLanguageQuery?: string;
  translatedQuery?: string;
  articles: Article[];
  error?: string;
  isLoadingSearch: boolean;
  searchPerformed: boolean;
  overallSummary?: string;
  isLoadingSummaries: boolean;
}
const initialSearchState: SearchState = { articles: [], isLoadingSearch: false, searchPerformed: false, isLoadingSummaries: false };

// Base URL for your backend API (replace with your actual backend URL)
const API_BASE_URL = 'https://your-backend-api.com/api'; // Placeholder

const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const [user, setUser] = useState<AppFirebase.User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [searchState, setSearchState] = useState<SearchState>(initialSearchState);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = AppFirebase.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      if (isAuthLoading) setIsAuthLoading(false);
    });
    const loadApiKey = async () => {
      try {
        const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE_NAME });
        if (credentials) setGeminiApiKey(credentials.password);
      } catch (error) { console.error('Failed to load API key on MainScreen:', error); }
    };
    loadApiKey();
    return unsubscribe;
  }, [isAuthLoading]);

  const fetchFromApi = async (endpoint: string, body: any, apiKey: string | null) => {
    if (!apiKey) {
      Alert.alert("API Key Missing", "Gemini API key is not set. Please set it in Settings.");
      throw new Error("API Key Missing");
    }
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Gemini-API-Key': apiKey },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!user) { Alert.alert("Sign In Required", "Please sign in."); return; }
    if (!geminiApiKey) { Alert.alert("API Key Missing", "Set Gemini API key in Settings."); return; }

    setSearchState({ ...initialSearchState, naturalLanguageQuery: query, isLoadingSearch: true, searchPerformed: true });
    try {
      // ** REPLACE MOCK WITH ACTUAL API CALL **
      // const result: SearchActionResultBackend = await fetchFromApi('search-articles', { naturalLanguageQuery: query }, geminiApiKey);
      const mockResult: SearchActionResultBackend = { naturalLanguageQuery: query, translatedQuery: `Mock translation of "${query}"`, articles: [ { title: `Mock Article 1 for ${query}`, link: 'https://example.com/1' }, { title: `Mock Article 2 for ${query}`, link: 'https://example.com/2' }]};
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      if (mockResult.error) setSearchState(prev => ({ ...prev, error: mockResult.error, isLoadingSearch: false }));
      else setSearchState(prev => ({ ...prev, translatedQuery: mockResult.translatedQuery, articles: mockResult.articles, isLoadingSearch: false }));
    } catch (e: any) { setSearchState(prev => ({ ...prev, error: e.message, isLoadingSearch: false })); }
  }, [user, geminiApiKey]);

  const handleSummarizeAndSynthesize = useCallback(async () => {
    if (!user || searchState.articles.length === 0) return;
    if (!geminiApiKey) { Alert.alert("API Key Missing", "Set Gemini API key in Settings."); return; }

    setSearchState(prev => ({ ...prev, isLoadingSummaries: true, error: undefined, overallSummary: undefined }));
    try {
      // ** REPLACE MOCK WITH ACTUAL API CALL **
      // const result: SummarizeAllResultBackend = await fetchFromApi('summarize-articles', { articlesToSummarize: searchState.articles, queryContext: searchState.translatedQuery }, geminiApiKey);
      // This would likely be two calls: one to summarize, then one to synthesize.
      // For now, one mock call:
      const mockSummaryResult: SummarizeAllResultBackend = { overallSummary: `Overall mock summary for: "${searchState.translatedQuery}".`, updatedArticles: searchState.articles.map(a => ({...a, summary: `Mock summary for ${a.title}.`})) };
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (mockSummaryResult.error) setSearchState(prev => ({ ...prev, error: mockSummaryResult.error, isLoadingSummaries: false }));
      else setSearchState(prev => ({ ...prev, articles: mockSummaryResult.updatedArticles, overallSummary: mockSummaryResult.overallSummary, isLoadingSummaries: false }));
    } catch (e: any) { setSearchState(prev => ({ ...prev, error: e.message, isLoadingSummaries: false })); }
  }, [user, searchState.articles, searchState.translatedQuery, geminiApiKey]);

  const renderAuthContent = () => {
    if (isAuthLoading) return <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" color="#6200ee" /><Text style={styles.loadingText}>Loading Auth...</Text></View>;
    if (!user) return (
      <View style={styles.centeredMessageContainer}>
        <Text style={styles.title}>Scholar Chat Mobile</Text>
        <Text style={styles.subtitle}>Please sign in.</Text>
        <View style={styles.buttonContainer}><Button title="Sign In with Google" onPress={() => AppFirebase.signInWithGoogle().catch(err => Alert.alert("Sign In Error", err.message))} color="#4285F4" /></View>
        <View style={styles.buttonContainer}><Button title="Settings" onPress={() => navigation.navigate('Settings')} /></View>
      </View>
    );

    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Hi, {user.displayName?.split(' ')[0] || 'User'}!</Text>
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerButton}><Text style={styles.headerButtonText}>Settings</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => AppFirebase.signOut()} style={[styles.headerButton, {marginLeft: 10}]}><Text style={styles.headerButtonText}>Sign Out</Text></TouchableOpacity>
            </View>
        </View>
        <SearchForm onSearch={handleSearch} isLoading={searchState.isLoadingSearch} />
        {searchState.isLoadingSearch && <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" /><Text style={styles.loadingText}>Searching...</Text></View>}
        {searchState.error && <View style={styles.errorContainer}><Text style={styles.errorText}>{searchState.error}</Text></View>}
        {searchState.searchPerformed && !searchState.isLoadingSearch && searchState.articles.length === 0 && !searchState.error && <View style={styles.centeredMessageContainer}><Text>No articles found.</Text></View>}
        {searchState.articles.length > 0 && <View style={styles.listHeader}><Text style={styles.listTitle}>{searchState.translatedQuery ? `Results for: "${searchState.translatedQuery}"` : "Results"}</Text></View>}
        <FlatList data={searchState.articles} renderItem={({ item }) => <ArticleCard article={item} />} keyExtractor={(item, index) => item.link || `article-${index}`} scrollEnabled={false} />
        {searchState.articles.length > 0 && !searchState.overallSummary && !searchState.isLoadingSummaries && !searchState.isLoadingSearch &&
          <View style={styles.buttonContainer}><Button title="Summarize & Synthesize All" onPress={handleSummarizeAndSynthesize} color="#34A853" /></View>}
        {searchState.isLoadingSummaries && <View style={styles.centeredMessageContainer}><ActivityIndicator size="large" /><Text style={styles.loadingText}>Generating summaries...</Text></View>}
        {searchState.overallSummary && <View style={styles.summarySection}><Text style={styles.sectionTitle}>Overall Synthesis</Text><Text style={styles.overallSummaryText}>{searchState.overallSummary}</Text></View>}
      </ScrollView>
    );
  };
  return <View style={styles.flexContainer}>{renderAuthContent()}</View>;
};

const styles = StyleSheet.create({
  flexContainer: { flex: 1, backgroundColor: '#f0f2f5' },
  scrollContainer: { padding: 15, paddingBottom: 50 },
  centeredMessageContainer: { paddingVertical: 30, alignItems: 'center' }, // Removed flex:1
  loadingText: { marginTop:10, fontSize: 16, color: '#333'},
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#555', marginBottom: 25, textAlign: 'center' },
  buttonContainer: { width: '100%', marginTop: 15, marginBottom: 10, borderRadius: 8, overflow: 'hidden' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  welcomeText: { fontSize: 18, fontWeight: '500', color: '#333'},
  headerButton: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#e0e0e0', borderRadius: 6},
  headerButtonText: { fontSize: 14, color: '#333'},
  errorContainer: { padding: 15, backgroundColor: '#ffdddd', borderRadius: 6, marginVertical: 10},
  errorText: { color: '#D8000C', fontSize: 15, textAlign: 'center'},
  listHeader: { marginBottom: 10, marginTop: 10 },
  listTitle: { fontSize: 18, fontWeight: '600', color: '#444'},
  summarySection: { marginTop: 20, padding: 15, backgroundColor: '#e8f5e9', borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginBottom: 8 },
  overallSummaryText: { fontSize: 15, color: '#333', lineHeight: 22 },
});
export default MainScreen;

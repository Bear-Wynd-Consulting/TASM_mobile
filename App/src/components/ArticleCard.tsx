import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink, BookOpenText, Zap } from 'lucide-react-native';

export interface Article {
  title: string;
  link: string;
  summary?: string;
}
interface ArticleCardProps { article: Article; onSummarize?: (article: Article) => void; }

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSummarize }) => {
  const handleLinkPress = () => article.link && Linking.openURL(article.link).catch(err => console.error("Couldn't load page", err));
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{article.title}</Text>
      {article.link && (
        <TouchableOpacity onPress={handleLinkPress} style={styles.linkContainer}>
          <ExternalLink color="#4285F4" size={16} />
          <Text style={styles.linkText}>View Source</Text>
        </TouchableOpacity>
      )}
      {article.summary ? (
        <View style={styles.summaryContainer}>
          <BookOpenText color="#34A853" size={18} style={styles.summaryIcon} />
          <Text style={styles.summaryTitle}>Summary:</Text>
          <Text style={styles.summaryText}>{article.summary}</Text>
        </View>
      ) : onSummarize ? (
        <TouchableOpacity onPress={() => onSummarize(article)} style={styles.summarizeButton}>
          <Zap color="#fff" size={16} />
          <Text style={styles.summarizeButtonText}>Summarize</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  linkContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  linkText: { fontSize: 14, color: '#4285F4', marginLeft: 6, textDecorationLine: 'underline' },
  summaryContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  summaryIcon: { marginRight: 6, marginBottom: 4 },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: '#34A853', marginBottom: 4 },
  summaryText: { fontSize: 14, color: '#555', lineHeight: 20 },
  summarizeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6200ee', paddingVertical: 10, borderRadius: 20, marginTop: 12 },
  summarizeButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 8 }
});
export default ArticleCard;

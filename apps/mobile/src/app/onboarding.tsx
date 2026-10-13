import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Button } from 'react-native';
import { router } from 'expo-router';

import { api } from '../lib/api';

export default function OnboardingScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const searchTopics = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080'}/v0/api/topics/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.topics?.map((t: any) => t.name) || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topic: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(topic)) {
      newSelected.delete(topic);
    } else {
      newSelected.add(topic);
    }
    setSelected(newSelected);
  };

  const continueToFeed = async () => {
    try {
      await api.put('/v0/api/interests', { topics: Array.from(selected) });
      router.replace('/feed');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select interests</Text>
      <Text style={styles.subtitle}>Search for topics you are interested in</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Search topics (e.g., rust, web, ai)"
        value={query}
        onChangeText={searchTopics}
      />
      
      <FlatList
        data={results}
        keyExtractor={(item) => item}
        ListEmptyComponent={() => loading ? <Text>Loading...</Text> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.topicItem, selected.has(item) && styles.topicItemSelected]}
            onPress={() => toggleTopic(item)}
          >
            <Text style={[styles.topicText, selected.has(item) && styles.topicTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.list}
      />
      
      <Button
        title={`Continue (${selected.size} selected)`}
        onPress={continueToFeed}
        disabled={selected.size === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  list: {
    flex: 1,
    marginVertical: 12,
  },
  topicItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  topicItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  topicText: {
    fontSize: 14,
  },
  topicTextSelected: {
    color: '#fff',
  },
});

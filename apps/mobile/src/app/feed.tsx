import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Button } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';

import { api } from '../lib/api';

interface Repo {
  id: number;
  githubId?: number;
  fullName: string;
  url: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  topics: string[];
  owner: { login: string; avatarUrl?: string };
  isFork: boolean;
  isArchived: boolean;
}

interface FeedCard {
  id: number;
  position: number;
  sponsored: boolean;
  repository: Repo;
  score?: number;
  reason?: string[];
}

export default function FeedScreen() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();

  const fetchFeed = async (nextCursor?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '20' });
      if (nextCursor) params.append('cursor', nextCursor);
      const res = await api.get<any>(`/v0/api/feed?${params}`);
      if (res.cards) {
        setCards(res.cards);
        setCursor(res.cursor);
        setIndex(0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const current = cards[index];

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onEnd((event) => {
      if (event.translationY < -50 && index < cards.length - 1) {
        setIndex(index + 1);
      } else if (event.translationY > 50 && index > 0) {
        setIndex(index - 1);
      }
    });

  const handleLike = async () => {
    if (!current) return;
    try {
      await api.post(`/v0/api/repos/${current.repository.id}/like`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSave = async () => {
    if (!current) return;
    try {
      await api.post(`/v0/api/repos/${current.repository.id}/save`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDislike = async () => {
    if (!current) return;
    try {
      await api.post(`/v0/api/repos/${current.repository.id}/feedback`, { kind: 'show_fewer' });
      setIndex(index + 1 < cards.length ? index + 1 : 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleOpen = async () => {
    if (!current) return;
    try {
      await api.post(`/v0/api/repos/${current.repository.id}/open`);
      await Linking.openURL(current.repository.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Retry" onPress={() => fetchFeed(cursor)} />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.container}>
        <Text>No more repositories</Text>
        <Button title="Refresh" onPress={() => fetchFeed()} />
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <View style={styles.card}>
          {current.sponsored && <Text style={styles.sponsored}>Sponsored</Text>}
          <Text style={styles.title}>{current.repository.fullName}</Text>
          <Text style={styles.owner}>by {current.repository.owner.login}</Text>
          {current.repository.language && (
            <Text style={styles.meta}>Language: {current.repository.language}</Text>
          )}
          <Text style={styles.meta}>★ {current.repository.stars} | 🍴 {current.repository.forks}</Text>
          {current.repository.description && (
            <Text style={styles.description}>{current.repository.description}</Text>
          )}
          {current.repository.topics.length > 0 && (
            <Text style={styles.topics}>{current.repository.topics.join(', ')}</Text>
          )}
          <View style={styles.actions}>
            <Button title="Like" onPress={handleLike} />
            <Button title="Save" onPress={handleSave} />
            <Button title="Show fewer" onPress={handleDislike} />
            <Button title="Open" onPress={handleOpen} />
          </View>
          <Text style={styles.counter}>{index + 1} / {cards.length}</Text>
        </View>
        <Button title="Load more" onPress={() => fetchFeed(cursor)} />
      </View>
    </GestureDetector>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    minHeight: 300,
  },
  sponsored: {
    backgroundColor: '#FFD700',
    alignSelf: 'flex-start',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  owner: {
    fontSize: 14,
    color: '#666',
  },
  meta: {
    fontSize: 13,
    color: '#333',
  },
  description: {
    fontSize: 14,
    marginTop: 4,
  },
  topics: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  counter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
});

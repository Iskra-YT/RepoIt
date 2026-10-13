import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { api } from '../lib/api';

export default function MeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [following, setFollowing] = useState<any[]>([]);
  const [interests, setInterests] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const p: any = await api.get('/v0/api/me');
        setProfile(p);
        const f: any = await api.get('/v0/api/me/following');
        setFollowing(f.following || []);
        const i = await api.get('/v0/api/interests');
        setInterests(i);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/v0/api/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      await SecureStore.deleteItemAsync('session_token');
      api.setToken(null);
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {profile && (
        <View style={styles.section}>
          <Text>@{profile.username}</Text>
          <Text>Onboarded: {profile.onboarded ? 'Yes' : 'No'}</Text>
        </View>
      )}
      {interests && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <Text>{interests.topics?.map((t: any) => t.name).join(', ') || 'None'}</Text>
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Following ({following.length})</Text>
        <FlatList
          data={following}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text>{item.username}</Text>
            </View>
          )}
        />
      </View>
      <Button title="Settings" onPress={() => router.push('/settings')} />
      <Button title="Go to Feed" onPress={() => router.push('/feed')} />
      <Button title="Logout" onPress={handleLogout} color="red" />
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
  section: {
    gap: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  item: {
    padding: 8,
  },
});

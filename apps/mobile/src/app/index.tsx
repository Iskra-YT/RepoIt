import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Button, Linking } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { api, getAuthUrl, me } from '../lib/api';

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('session_token');
        if (!token) {
          setLoading(false);
          return;
        }
        api.setToken(token);
        const profile = await me();
        if (!profile.onboarded) {
          router.replace('/onboarding');
        } else {
          router.replace('/feed');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSignIn = async () => {
    try {
      const redirectUri = await Linking.getInitialURL();
      // Fallback to expo scheme
      const redirect = redirectUri || 'repoit://auth';
      const authUrl = await getAuthUrl(redirect);
      await Linking.openURL(authUrl);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RepoIt</Text>
      <Text style={styles.subtitle}>Discover GitHub repositories</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Sign in with GitHub" onPress={handleSignIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
});

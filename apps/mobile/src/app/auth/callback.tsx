import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { api, exchangeSession } from '../../lib/api';

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; github_id?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const code = params.code;
        if (!code || typeof code !== 'string') {
          throw new Error('Missing auth code');
        }
        const { token } = await exchangeSession(code);
        await SecureStore.setItemAsync('session_token', token);
        api.setToken(token);
        router.replace('/');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [params.code]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Signing in...</Text>
    </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});

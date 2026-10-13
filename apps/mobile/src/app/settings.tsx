import { View, Text, StyleSheet, Switch, Button } from 'react-native';
import { useEffect, useState } from 'react';

import { api } from '../lib/api';

export default function SettingsScreen() {
  const [, setProfile] = useState<any>(null);
  const [likedPublic, setLikedPublic] = useState(true);
  const [savedPublic, setSavedPublic] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p: any = await api.get('/v0/api/me');
        setProfile(p);
        setLikedPublic(p.likedPublic);
        setSavedPublic(p.savedPublic);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const updateSettings = async () => {
    try {
      await api.patch('/v0/api/me', {
        likedPublic,
        savedPublic,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text>Liked repos public</Text>
          <Switch value={likedPublic} onValueChange={setLikedPublic} />
        </View>
        <View style={styles.row}>
          <Text>Saved repos public</Text>
          <Switch value={savedPublic} onValueChange={setSavedPublic} />
        </View>
      </View>
      <Button title="Save" onPress={updateSettings} />
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
    gap: 12,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

import { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const screenWidth = Dimensions.get('window').width;

export default function PublicGarage() {
  const { uid } = useLocalSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const currentUid = auth.currentUser?.uid || '';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!uid) return;
        const docRef = doc(db, 'users', uid.toString());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setIsFollowing(data.followers?.includes(currentUid));
        }
      } catch (err) {
        console.error('Error loading user garage:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  const handleFollowToggle = async () => {
    if (!uid || !currentUid || currentUid === uid) return;
    try {
      const docRef = doc(db, 'users', uid.toString());
      await updateDoc(docRef, {
        followers: isFollowing
          ? arrayRemove(currentUid)
          : arrayUnion(currentUid),
      });
      setIsFollowing(!isFollowing);
      const updated = await getDoc(docRef);
      setUserData(updated.data());
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#555" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>User not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: userData.photoURL || 'https://placehold.co/100x100' }}
          style={styles.avatarLarge}
        />
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.name}>{userData.displayName || 'Unnamed User'}</Text>
          <Text style={styles.followers}>
            {userData.followers?.length || 0} follower
            {userData.followers?.length === 1 ? '' : 's'}
          </Text>
          {uid !== currentUid && (
            <Text
              onPress={handleFollowToggle}
              style={[
                styles.followBtn,
                {
                  backgroundColor: isFollowing ? '#ddd' : '#007AFF',
                  color: isFollowing ? '#333' : '#fff',
                },
              ]}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Garage</Text>
      {userData.garage?.length > 0 ? (
        <FlatList
          data={userData.garage}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: item.image || 'https://placehold.co/400x240' }}
                style={styles.image}
              />
              <View style={styles.overlay}>
                <Text style={styles.carTitle}>
                  {item.year} {item.make} {item.model}
                </Text>
                <Text style={styles.carMods}>
                  {item.mods?.length
                    ? item.mods.map((m: any) => `🔧 ${m.text}`).join('\n')
                    : 'No mods listed'}
                </Text>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noCars}>This user has no cars listed.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: { fontSize: 22, fontWeight: 'bold' },
  followers: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  followBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: { fontSize: 18, marginVertical: 15 },
  card: {
    marginBottom: 20,
    width: screenWidth * 0.9,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 250,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: '100%',
  },
  carTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  carMods: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  noCars: { fontSize: 16, marginTop: 20, color: '#555' },
  notFound: { fontSize: 18, color: '#888' },
});

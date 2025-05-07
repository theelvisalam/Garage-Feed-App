import { View, Text, Image, FlatList, StyleSheet, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function MyGarage() {
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.warn('No user ID found.');
        return;
      }
  
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.warn('No user document found for UID:', uid);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchUserData();
  }, []);

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: userData.photoURL || 'https://placehold.co/100x100' }} style={styles.avatar} />
      <Text style={styles.name}>{userData.displayName || 'No Name'}</Text>

      <Button title="Add Car to Garage" onPress={() => router.push('/addCar')} />

      <Text style={styles.sectionTitle}>My Cars</Text>
      {userData.garage && userData.garage.length > 0 ? (
        <FlatList
          data={userData.garage}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.carCard}>
              <Image
                source={{ uri: item.image || 'https://placehold.co/200x120' }}
                style={styles.carImage}
              />
              <Text style={styles.carText}>{item.year} {item.make} {item.model}</Text>
              <Text style={styles.modsText}>{item.mods}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noCars}>No cars in your garage yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  loading: { fontSize: 16, marginTop: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginTop: 30, marginBottom: 10 },
  carCard: { marginBottom: 20, alignItems: 'center' },
  carImage: { width: 250, height: 140, borderRadius: 10, marginBottom: 5 },
  carText: { fontSize: 16, fontWeight: '600' },
  modsText: { fontSize: 14, color: '#666' },
  noCars: { fontSize: 16, marginTop: 20 },
});

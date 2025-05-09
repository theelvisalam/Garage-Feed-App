import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Image, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function CarDetails() {
  const { car } = useLocalSearchParams();
  const router = useRouter();

  const parsedCar = typeof car === 'string' ? JSON.parse(car) : car;
  const [userDoc, setUserDoc] = useState<any>(null);

  useEffect(() => {
    const fetchUserDoc = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserDoc(docRef);
      }
    };

    fetchUserDoc();
  }, []);

  const handleDeleteCar = async () => {
    Alert.alert('Delete Car', 'Are you sure you want to delete this car?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!userDoc) return;
          await updateDoc(userDoc, {
            garage: arrayRemove(parsedCar),
          });
          Alert.alert('Car deleted!');
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: parsedCar.image || 'https://placehold.co/300x200' }}
        style={styles.image}
      />
      <Text style={styles.title}>
        {parsedCar.year} {parsedCar.make} {parsedCar.model}
      </Text>

      <Text style={styles.sectionTitle}>Modifications</Text>
      {parsedCar.mods?.length ? (
        parsedCar.mods
        .sort((a: any, b: any) => b.date - a.date)
        .map((mod: any, idx: number) => (
          <Text key={idx} style={styles.modItem}>
            🛠 {mod.text} – {new Date(mod.date).toLocaleDateString()}
          </Text>
        ))
      ) : (
        <Text style={styles.noMods}>No mods added</Text>
      )}

      <View style={styles.buttonGroup}>
        <Button
          title="Edit"
          onPress={() =>
            router.push({ pathname: '/editCar', params: { car: JSON.stringify(parsedCar) } })
          }
        />
        <Button title="Delete" color="red" onPress={handleDeleteCar} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  modItem: {
    fontSize: 16,
    color: '#444',
    marginBottom: 4,
  },
  noMods: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 25,
  },
});

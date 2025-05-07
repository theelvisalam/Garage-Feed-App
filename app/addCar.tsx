import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function AddCar() {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [image, setImage] = useState('');
  const [mods, setMods] = useState('');
  const router = useRouter();

  const handleAddCar = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('No user ID');

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        garage: arrayUnion({
          make,
          model,
          year: parseInt(year),
          image,
          mods,
        }),
      });

      Alert.alert('Car added to garage!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add a Car to Your Garage</Text>

      <TextInput placeholder="Make" value={make} onChangeText={setMake} style={styles.input} />
      <TextInput placeholder="Model" value={model} onChangeText={setModel} style={styles.input} />
      <TextInput placeholder="Year" value={year} onChangeText={setYear} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Image URL" value={image} onChangeText={setImage} style={styles.input} />
      <TextInput placeholder="Modifications" value={mods} onChangeText={setMods} style={styles.input} />

      <Button title="Add Car" onPress={handleAddCar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
});

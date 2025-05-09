import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

export default function AddCar() {
  const theme = useTheme();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mods, setMods] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri: string, path: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storage = getStorage();
    const imageRef = ref(storage, path);

    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleAddCar = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('No user ID');

      const carId = uuidv4();
      let imageUrl = '';

      if (imageUri) {
        imageUrl = await uploadImageAsync(imageUri, `users/${uid}/cars/${carId}.jpg`);
      }

      const newCar = {
        id: carId,
        make,
        model,
        year: parseInt(year),
        image: imageUrl,
        mods: mods
          .split(',')
          .map((mod: string) => ({ text: mod.trim(), date: Date.now() }))
          .filter(mod => mod.text),
        createdAt: Date.now(),
      };

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        garage: arrayUnion(newCar),
      });

      Alert.alert('✅ Car added with image!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Add a Car to Your Garage</Text>

      <TextInput
        placeholder="Make"
        placeholderTextColor={theme.mutedText}
        value={make}
        onChangeText={setMake}
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
      />
      <TextInput
        placeholder="Model"
        placeholderTextColor={theme.mutedText}
        value={model}
        onChangeText={setModel}
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
      />
      <TextInput
        placeholder="Year"
        placeholderTextColor={theme.mutedText}
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
      />
      <TextInput
        placeholder="Modifications (comma separated)"
        placeholderTextColor={theme.mutedText}
        value={mods}
        onChangeText={setMods}
        style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.text }]}
      />

      <Button title="Pick Image" onPress={pickImage} />

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: 200, borderRadius: 10, marginVertical: 12 }}
        />
      )}

      <Button title="Add Car" onPress={handleAddCar} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
});

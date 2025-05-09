import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

export default function EditCar() {
  const theme = useTheme();
  const { car } = useLocalSearchParams();
  const router = useRouter();

  const parsedCar = typeof car === 'string' ? JSON.parse(car) : car;

  const [make, setMake] = useState(parsedCar?.make || '');
  const [model, setModel] = useState(parsedCar?.model || '');
  const [year, setYear] = useState(parsedCar?.year?.toString() || '');
  const [mods, setMods] = useState(
    parsedCar?.mods?.map((m: { text: string }) => m.text).join(', ') || ''
  );
  const [imageUri, setImageUri] = useState<string | null>(parsedCar?.image || null);
  const [newImage, setNewImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
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

  const handleUpdateCar = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');

      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) throw new Error('User document not found');

      const existingCar = parsedCar;
      let imageUrl = imageUri;

      if (newImage) {
        imageUrl = await uploadImageAsync(newImage, `users/${uid}/cars/${existingCar.id}.jpg`);
      }

      const updatedCar = {
        ...existingCar,
        make,
        model,
        year: parseInt(year),
        mods: mods
          .split(',')
          .map((m: string): { text: string; date: number } => ({
            text: m.trim(),
            date: Date.now(),
          }))
          .filter((mod: { text: string; date: number }) => mod.text),
        image: imageUrl,
      };

      await updateDoc(userRef, { garage: arrayRemove(existingCar) });
      await updateDoc(userRef, { garage: arrayUnion(updatedCar) });

      Alert.alert('✅ Car updated!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Edit Car</Text>

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

      <Button title="Pick New Image" onPress={pickImage} />

      {(newImage || imageUri) && (
        <Image
          source={{ uri: newImage || imageUri || '' }}
          style={{ width: '100%', height: 200, borderRadius: 10, marginVertical: 12 }}
        />
      )}

      <Button title="Save Changes" onPress={handleUpdateCar} />
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

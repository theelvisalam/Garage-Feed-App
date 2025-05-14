import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import * as AuthModule from '../../contexts/AuthContext';

console.log('💥 AuthModule:', AuthModule);

export default function MyGarage() {
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [modPromptVisible, setModPromptVisible] = useState(false);
  const [modInput, setModInput] = useState('');
  const [targetCar, setTargetCar] = useState<any>(null);
  const router = useRouter();
  const theme = useTheme();

  const fetchOrCreateUserData = async () => {
    if (!user) {
      router.replace('/login');
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        const newUser = {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          garage: [],
        };
        await setDoc(docRef, newUser);
        setUserData(newUser);
      }
    } catch (error) {
      console.error('🔥 Error in fetchOrCreateUserData:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchOrCreateUserData();
    }
  }, [user, loading]);

  const handleDeleteCar = async (car: any) => {
    Alert.alert('Delete Car', 'Are you sure you want to delete this car?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const uid = auth.currentUser?.uid;
            if (!uid) throw new Error('No user ID');

            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
              garage: arrayRemove(car),
            });

            Alert.alert('Car deleted!');
            fetchOrCreateUserData();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const openModPrompt = (car: any) => {
    setTargetCar(car);
    setModInput('');
    setModPromptVisible(true);
  };

  const handleAddMod = async () => {
    if (!modInput.trim() || !targetCar) return;

    const updatedCar = {
      ...targetCar,
      mods: [...(targetCar.mods || []), { text: modInput.trim(), date: Date.now() }],
    };

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('No user ID');

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        garage: arrayRemove(targetCar),
      });

      await updateDoc(userRef, {
        garage: arrayUnion(updatedCar),
      });

      setModPromptVisible(false);
      Alert.alert('Mod added!');
      fetchOrCreateUserData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading || !userData) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: theme.text }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.scrollContainer, { backgroundColor: theme.background }]} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={styles.container}>
        <Image
          source={{ uri: userData.photoURL || 'https://placehold.co/100x100' }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: theme.text }]}>{userData.displayName || 'No Name'}</Text>

        <Button title="Add Car to Garage" onPress={() => router.push('/addCar')} />

        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>My Cars</Text>
        {userData.garage && userData.garage.length > 0 ? (
          <FlatList
            data={userData.garage}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.carCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: '/carDetails', params: { car: JSON.stringify(item) } })
                  }
                >
                  <Image
                    source={{ uri: item.image || 'https://placehold.co/200x120' }}
                    style={styles.carImage}
                  />
                  <Text style={[styles.carText, { color: theme.text }]}> {item.year} {item.make} {item.model} </Text>
                  <Text style={[styles.modsText, { color: theme.mutedText }]}> Mods: {item.mods?.length ? item.mods.map((mod: any) => mod.text).join(', ') : 'None'} </Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                  <Button
                    title="Edit"
                    onPress={() =>
                      router.push({ pathname: '/editCar', params: { car: JSON.stringify(item) } })
                    }
                  />
                  <Button title="Delete" color="red" onPress={() => handleDeleteCar(item)} />
                  <Button title="Add Mod" onPress={() => openModPrompt(item)} />
                </View>
              </View>
            )}
          />
        ) : (
          <Text style={{ fontSize: 16, marginTop: 20, color: theme.primary }}>No cars in your garage yet.</Text>
        )}

        {/* Mod Prompt Modal */}
        <Modal visible={modPromptVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add a New Mod</Text>
              <TextInput
                placeholder="Enter mod"
                placeholderTextColor={theme.mutedText}
                value={modInput}
                onChangeText={setModInput}
                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
              />
              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setModPromptVisible(false)} />
                <Button title="Add Mod" onPress={handleAddMod} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  container: { flex: 1, padding: 20, alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginTop: 30, marginBottom: 10 },
  carCard: {
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    width: 300,
  },
  carImage: { width: 250, height: 140, borderRadius: 10, marginBottom: 5 },
  carText: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  modsText: { fontSize: 14, marginBottom: 10 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000099',
  },
  modalContainer: {
    padding: 25,
    width: '80%',
    borderRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  input: {
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
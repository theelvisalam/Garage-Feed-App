import {
  View,
  Text,
  Image,
  FlatList,
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

export default function ProfileScreen() {
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
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black px-4 pt-12" contentContainerStyle={{ alignItems: 'center' }}>
      <View className="items-center mb-6">
        <Image
          source={{ uri: userData.photoURL || 'https://placehold.co/100x100' }}
          className="w-24 h-24 rounded-full border border-zinc-700 mb-4"
        />
        <Text className="text-white text-2xl font-bold">{userData.displayName || 'No Name'}</Text>
        <Text className="text-zinc-400">{userData.email}</Text>
        <Text className="text-white mt-2">Garage Cars: {userData.garage?.length || 0}</Text>
      </View>

      <View className="bg-zinc-900 rounded-2xl p-4 mb-6 shadow w-full max-w-xl">
        <Button title="Add Car to Garage" onPress={() => router.push('/addCar')} />
      </View>

      <View className="w-full max-w-xl space-y-4">
        {userData.garage?.map((item: any) => (
          <View key={item.id} className="bg-zinc-900 rounded-2xl p-4 shadow">
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: '/carDetails', params: { car: JSON.stringify(item) } })
              }
            >
              <Image
                source={{ uri: item.image || 'https://placehold.co/200x120' }}
                className="w-full h-40 rounded-lg mb-2"
              />
              <Text className="text-white font-bold text-lg">
                {item.year} {item.make} {item.model}
              </Text>
              <Text className="text-zinc-400">Mods: {item.mods?.length ? item.mods.map((mod: any) => mod.text).join(', ') : 'None'}</Text>
            </TouchableOpacity>
            <View className="flex-row justify-between mt-3 space-x-2">
              <Button title="Edit" onPress={() => router.push({ pathname: '/editCar', params: { car: JSON.stringify(item) } })} />
              <Button title="Delete" color="red" onPress={() => handleDeleteCar(item)} />
              <Button title="Add Mod" onPress={() => openModPrompt(item)} />
            </View>
          </View>
        )) || (
          <Text className="text-zinc-400">No cars in your garage yet.</Text>
        )}
      </View>

      <Modal visible={modPromptVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/70">
          <View className="bg-zinc-900 p-6 rounded-2xl w-11/12">
            <Text className="text-white text-lg font-bold mb-2">Add a New Mod</Text>
            <TextInput
              placeholder="Enter mod"
              placeholderTextColor="#999"
              value={modInput}
              onChangeText={setModInput}
              className="border border-zinc-600 bg-black text-white p-3 rounded-lg mb-4"
            />
            <View className="flex-row justify-between">
              <Button title="Cancel" onPress={() => setModPromptVisible(false)} />
              <Button title="Add Mod" onPress={handleAddMod} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

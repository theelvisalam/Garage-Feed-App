import { View, Text, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    };
    fetchData();
  }, []);

  return (
    <View className="flex-1 bg-black px-4 pt-12">
      <Text className="text-white text-2xl font-bold mb-6 text-center">GarageFeed</Text>
      <ScrollView className="space-y-4">
        <View className="bg-zinc-900 rounded-2xl p-4 shadow">
          <Text className="text-white font-semibold text-lg">Welcome, {userData?.username || 'Driver'}!</Text>
          <Text className="text-zinc-400">Track your builds. Share your mods. Meet other car lovers.</Text>
        </View>

        <View className="bg-zinc-900 rounded-2xl p-4 shadow">
          <Text className="text-white text-lg font-bold mb-1">Get Started</Text>
          <Link href="/login" asChild>
            <Text className="text-blue-400 underline">Log In to Your Garage</Text>
          </Link>
        </View>

        <View className="bg-zinc-900 rounded-2xl p-4 shadow">
          <Text className="text-white text-lg font-bold">Forum Highlight</Text>
          <Text className="text-zinc-400 mt-1">New thread: Best coilover setups for street/track builds?</Text>
        </View>
      </ScrollView>
    </View>
  );
}

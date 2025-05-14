import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Button, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View className="flex-1 bg-black justify-center px-6">
      <Text className="text-white text-3xl font-bold text-center mb-8">GarageFeed Login</Text>

      <View className="bg-zinc-900 p-5 rounded-2xl shadow mb-4">
        <TextInput
          className="border border-zinc-700 bg-black text-white p-3 rounded-lg mb-4"
          placeholder="Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          className="border border-zinc-700 bg-black text-white p-3 rounded-lg mb-4"
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Log In" onPress={handleLogin} />
      </View>

      <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
        <Text className="text-blue-400 text-center mt-4">Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

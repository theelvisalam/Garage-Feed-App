import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Button,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function ForumsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(docs);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'forumPosts'), {
        text: newPost.trim(),
        uid: user?.uid,
        createdAt: serverTimestamp(),
        author: user?.displayName || 'Anonymous',
      });
      setNewPost('');
      fetchPosts();
    } catch (err) {
      Alert.alert('Error', 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <ScrollView className="flex-1 bg-black pt-12 px-4" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-2xl font-bold mb-4">GarageFeed Forums</Text>

      <View className="bg-zinc-900 rounded-2xl p-4 mb-6 shadow">
        <Text className="text-white text-lg font-bold mb-2">Start a New Thread</Text>
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor="#999"
          value={newPost}
          onChangeText={setNewPost}
          multiline
          className="border border-zinc-700 bg-black text-white p-3 rounded-lg h-24"
        />
        <View className="mt-3">
          <Button title={loading ? 'Posting...' : 'Post'} onPress={handleCreatePost} disabled={loading} />
        </View>
      </View>

      {posts.length === 0 ? (
        <Text className="text-zinc-400 text-center">No posts yet. Be the first to start a discussion!</Text>
      ) : (
        posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            className="bg-zinc-900 rounded-2xl p-4 mb-4 shadow"
            onPress={() => router.push(`../forumPost/${post.id}`)}
          >
            <Text className="text-white text-base font-bold">{post.author}</Text>
            <Text className="text-zinc-400 mt-1">{post.text}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

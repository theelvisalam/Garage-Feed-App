import { View, Text, ScrollView, TextInput, Button, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function ForumPostScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPost = async () => {
    if (!id) return;
    try {
      const postRef = doc(db, 'forumPosts', id.toString());
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        setPost({ id: postSnap.id, ...postSnap.data() });
      }
    } catch (err) {
      console.error('Error fetching post:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const q = query(
        collection(db, 'forumPosts', id.toString(), 'comments'),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'forumPosts', id.toString(), 'comments'), {
        text: newComment.trim(),
        createdAt: serverTimestamp(),
        author: user?.displayName || 'Anonymous',
        uid: user?.uid,
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      Alert.alert('Error', 'Failed to add comment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  if (!post) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white text-base">Loading post...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black pt-12 px-4" showsVerticalScrollIndicator={false}>
      <View className="bg-zinc-900 p-4 rounded-2xl shadow mb-6">
        <Text className="text-white text-xl font-bold mb-1">{post.author}</Text>
        <Text className="text-zinc-400 text-base leading-relaxed">{post.text}</Text>
      </View>

      <Text className="text-white text-xl font-bold mb-3">Comments</Text>

      {comments.length === 0 ? (
        <Text className="text-zinc-400 mb-6">No comments yet. Be the first to join the discussion!</Text>
      ) : (
        <View className="space-y-3 mb-6">
          {comments.map((comment) => (
            <View key={comment.id} className="bg-zinc-900 rounded-2xl p-3 shadow">
              <Text className="text-white font-semibold text-base">{comment.author}</Text>
              <Text className="text-zinc-400 text-sm mt-1 leading-snug">{comment.text}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="bg-zinc-900 p-4 rounded-2xl shadow">
        <Text className="text-white text-lg font-bold mb-2">Add a Comment</Text>
        <TextInput
          placeholder="Write your reply..."
          placeholderTextColor="#999"
          value={newComment}
          onChangeText={setNewComment}
          multiline
          className="border border-zinc-700 bg-black text-white p-3 rounded-lg h-24 mb-3"
        />
        <Button title={loading ? 'Posting...' : 'Post Comment'} onPress={handleAddComment} disabled={loading} />
      </View>
    </ScrollView>
  );
}

import {
    View,
    Text,
    FlatList,
    TextInput,
    Button,
    StyleSheet,
    Modal,
    Image,
    Alert,
  } from 'react-native';
  import { useEffect, useState } from 'react';
  import { collection, addDoc, getDocs, serverTimestamp, orderBy, query, updateDoc } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  import { useAuth } from '../contexts/AuthContext';
  import * as ImagePicker from 'expo-image-picker';
  import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { useTheme } from '../contexts/ThemeContext';
  
  export default function Forums() {
    const theme = useTheme();
    const { user } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      fetchPosts();
    }, []);
  
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'forums'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPosts(data);
      } catch (err) {
        console.error('Error loading posts:', err);
      }
    };
  
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
  
    const handleCreatePost = async () => {
      if (!title.trim() || !content.trim()) {
        Alert.alert('Title and content are required.');
        return;
      }
  
      if (!user) {
        Alert.alert('You must be logged in to post.');
        return;
      }
  
      try {
        setLoading(true);
  
        const newPostRef = await addDoc(collection(db, 'forums'), {
          title: title.trim(),
          content: content.trim(),
          authorUid: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorPhoto: user.photoURL || '',
          createdAt: serverTimestamp(),
          imageUrl: '',
        });
  
        if (imageUri) {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const storage = getStorage();
          const imageRef = ref(storage, `forums/${newPostRef.id}.jpg`);
          await uploadBytes(imageRef, blob);
          const downloadURL = await getDownloadURL(imageRef);
  
          await updateDoc(newPostRef, { imageUrl: downloadURL });
        }
  
        setModalVisible(false);
        setTitle('');
        setContent('');
        setImageUri(null);
        fetchPosts();
      } catch (err) {
        Alert.alert('Error', 'Could not create post.');
      } finally {
        setLoading(false);
      }
    };
  
    if (!user) {
      return (
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <Text style={{ fontSize: 16, textAlign: 'center', color: theme.text }}>
            You must be logged in to view and post in the forums.
          </Text>
        </View>
      );
    }
  
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.header, { color: theme.text }]}>GarageFeed Forums</Text>
  
        <Button title="Create New Post" onPress={() => setModalVisible(true)} />
  
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={[styles.postCard, { backgroundColor: theme.card }]}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: item.authorPhoto || 'https://placehold.co/50x50' }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={[styles.author, { color: theme.text }]}>{item.authorName}</Text>
                  <Text style={[styles.date, { color: theme.mutedText }]}>
                    {item.createdAt?.toDate
                      ? new Date(item.createdAt.toDate()).toLocaleString()
                      : 'Just now'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.postTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.postContent, { color: theme.mutedText }]}>{item.content}</Text>
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 10 }}
                />
              )}
            </View>
          )}
        />
  
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>New Post</Text>
              <TextInput
                placeholder="Title"
                placeholderTextColor={theme.mutedText}
                value={title}
                onChangeText={setTitle}
                style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
              />
              <TextInput
                placeholder="Content"
                placeholderTextColor={theme.mutedText}
                value={content}
                onChangeText={setContent}
                multiline
                style={[styles.input, { height: 100, borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
              />
              <Button title="Pick Image" onPress={pickImage} />
              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 10 }}
                />
              )}
              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} />
                <Button title={loading ? 'Posting...' : 'Post'} onPress={handleCreatePost} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    postCard: {
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    author: { fontWeight: 'bold', fontSize: 16 },
    date: { fontSize: 12 },
    postTitle: { fontSize: 18, fontWeight: '600', marginTop: 6 },
    postContent: { fontSize: 14, marginTop: 4 },
  
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: '#00000088',
      paddingHorizontal: 20,
    },
    modalContent: {
      padding: 20,
      borderRadius: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    input: {
      borderWidth: 1,
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 10,
    },
  });
  
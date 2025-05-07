import { View, Text } from 'react-native';
import { auth, db } from '../../../firebaseConfig';


export default function TestSignup() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>This is the SIGNUP page!</Text>
    </View>
  );
}

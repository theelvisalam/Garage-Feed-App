import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCBE6yXks5O2b_49pFBz_jZate9VPtevf0',
  authDomain: 'garagefeed-a0273.firebaseapp.com',
  projectId: 'garagefeed-a0273',
  storageBucket: 'garagefeed-a0273.appspot.com',
  messagingSenderId: '192112542398',
  appId: '1:192112542398:web:756607e946e45d760dd4ef',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

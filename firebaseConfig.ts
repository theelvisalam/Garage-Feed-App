import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseKeys } from './firebaseKeys';

const app = initializeApp(firebaseKeys);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

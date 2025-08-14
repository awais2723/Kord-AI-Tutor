/* Setting up a Firebase app using the Firebase SDK. Here's a breakdown of what
each part is doing: */
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'node_modules/firebase/auth';
import { getFirestore } from 'node_modules/firebase/firestore';
import { getStorage } from 'node_modules/firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const firebaseConfig = {
//   apiKey: "AIzaSyBzTuPcNA1ZxTfnMVAVoA7EFwwi1z8iYhk",
//   authDomain: "kord-snap-and-solve.firebaseapp.com",
//   projectId: "kord-snap-and-solve",
//   storageBucket: "kord-snap-and-solve.firebasestorage.app",
//   messagingSenderId: "1068297986797",
//   appId: "1:1068297986797:web:1166792edbfc4fdab022e4"
// };

const firebaseConfig = {
  apiKey: 'AIzaSyC_lOtn7ehxnF2aQBQ-wf4cXTCQj0Gdk48',
  authDomain: 'kord-ai-tutor.firebaseapp.com',
  projectId: 'kord-ai-tutor',
  storageBucket: 'kord-ai-tutor.firebasestorage.app',
  messagingSenderId: '599983718759',
  appId: '1:599983718759:web:35254e8da83e111c1cafc2',
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

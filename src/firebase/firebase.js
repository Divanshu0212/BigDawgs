import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Your Firebase config object
  // Get this from Firebase Console after creating a project
  apiKey: "AIzaSyDXFJmnfDrL7JDIbCkD-CFLJaBTo09yTR0",
  authDomain: "bigdawgs0212.firebaseapp.com",
  projectId: "bigdawgs0212",
  storageBucket: "bigdawgs0212.firebasestorage.app",
  messagingSenderId: "325696385660",
  appId: "1:325696385660:web:4367d2cff35350195a4ff9",
  measurementId: "G-4XSN0MTNC6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
console.log(auth)
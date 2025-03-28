
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBYkgDjn9ukD8s77WPwDsPVyH7Wqd6218Y",
  authDomain: "market-1edce.firebaseapp.com",
  projectId: "market-1edce",
  storageBucket: "market-1edce.appspot.com",
  messagingSenderId: "541298887942",
  appId: "1:541298887942:web:e2dd761492e9f0fa582287"
};


const app = initializeApp(firebaseConfig);
export const db =  getFirestore(app);
export const storage = getStorage(app);
export default app;
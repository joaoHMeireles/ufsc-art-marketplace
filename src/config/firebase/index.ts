import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
// IMPORTANTE: Substitua pelos valores reais do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDevelopment",
  authDomain: "arte-ufsc-dev.firebaseapp.com",
  projectId: "arte-ufsc-dev",
  storageBucket: "arte-ufsc-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
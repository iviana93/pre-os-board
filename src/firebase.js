import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 1. Adicione esta linha

const firebaseConfig = {
  apiKey: "AIzaSyBR3Ic6TNkKmq87FlA95zSDj6Zl6Hktxj8",
  authDomain: "pre-os-board.firebaseapp.com",
  projectId: "pre-os-board",
  storageBucket: "pre-os-board.firebasestorage.app",
  messagingSenderId: "387068448391",
  appId: "1:387068448391:web:50a2084e1413a436f83222"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Adicione esta linha para exportar o banco de dados
export const db = getFirestore(app);
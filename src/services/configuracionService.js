import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const configRef = () => doc(db, 'configuracion', 'apariencia');

export function subscribeToApariencia(callback) {
  return onSnapshot(configRef(), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function guardarApariencia(datos) {
  return setDoc(configRef(), datos, { merge: true });
}
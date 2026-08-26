// Servicio de autenticación.
// Los componentes NUNCA deben importar 'firebase/auth' directamente:
// siempre pasan por este servicio.

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

// Un usuario es administrador si existe un documento con su UID
// en la colección 'admins'. Máximo 3 administradores, mismos permisos.
export async function isUserAdmin(uid) {
  if (!uid) return false;
  const adminDoc = await getDoc(doc(db, 'admins', uid));
  return adminDoc.exists();
}

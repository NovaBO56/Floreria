import { createContext, useContext, useEffect, useState } from 'react';

import {
  subscribeToAuthChanges,
  isUserAdmin,
  login as loginService,
  logout as logoutService,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      console.log('AUTH: usuario detectado:', user?.email);
      console.log('AUTH: UID:', user?.uid);

      setCurrentUser(user);

      if (user) {
        try {
          console.log('AUTH: comprobando administrador...');

          const admin = await isUserAdmin(user.uid);

          console.log('AUTH: ¿es administrador?', admin);

          setIsAdmin(admin);
        } catch (error) {
          console.error('AUTH: error comprobando administrador:', error);

          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    loading,
    login: loginService,
    logout: logoutService,
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}
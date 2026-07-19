import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurer la session depuis localStorage au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, motDePasse) => {
  const response = await api.post('/auth/login', { email, motDePasse });
  const { token: newToken, user: newUser, premiereConnexion } = response.data;

  setToken(newToken);
  setUser(newUser);
  localStorage.setItem('token', newToken);
  localStorage.setItem('user', JSON.stringify(newUser));

  return response.data;
};

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Même si l'appel échoue, on déconnecte côté client
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setupAxiosInterceptors } from '../../services/api';
import { Alert } from 'react-native';

const TOKEN_KEY = 'userToken';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async (token) => {},
  logout: async () => {},
  updateUser: (newUserData) => {}, // ▼▼▼ NOU: Adăugat placeholder ▼▼▼
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Funcția de Logout (definită prima) ---
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      delete api.defaults.headers.common['Authorization'];
    } catch (e) {
      console.error("[AuthContext] Eroare la ștergerea token-ului:", e);
    } finally {
      setUser(null);
    }
  };

  // Hook pentru a seta interceptorul global
  useEffect(() => {
    setupAxiosInterceptors(logout);
  }, []); 

  // Hook-ul de încărcare a aplicației
  useEffect(() => {
    async function loadToken() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

        if (storedToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // ►►► MODIFICAT: Ne asigurăm că /me preia și 'avatar_url' (ceea ce face acum)
          const profileResponse = await api.get('/api/profile/me');
          setUser(profileResponse.data); 
          console.log("[AuthContext] Token valid, restaurare sesiune reușită.");
        }
      } catch (e) {
        console.error("[AuthContext] Restaurare sesiune eșuată (token expirat/invalid):", e.message);
        
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
          // Interceptorul se ocupă de alertă
        } else if (e.message.includes('Network Error')) {
          Alert.alert("Eroare de Rețea", "Nu s-a putut conecta la server. Verifică conexiunea la internet.");
        }
        
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false); 
      }
    }
    
    loadToken();
  }, []); 

  // --- Funcția de Login (neschimbată) ---
  const login = async (token) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const profileResponse = await api.get('/api/profile/me');
      setUser(profileResponse.data); 

    } catch (e) {
      console.error("[AuthContext] Eroare la login:", e);
      setUser(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      delete api.defaults.headers.common['Authorization'];
    }
  };
  
  // ▼▼▼ NOU: Funcție pentru a actualiza datele utilizatorului (avatar) ▼▼▼
  const updateUser = (newUserData) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      // Combinăm datele vechi cu cele noi (ex: { ...user, avatar_url: 'nou.jpg' })
      const updatedUser = { ...currentUser, ...newUserData };
      console.log("[AuthContext] Date utilizator actualizate:", updatedUser);
      return updatedUser;
    });
  };
  // ▲▲▲ Sfârșit funcție nouă ▲▲▲
  
  // Funcție nouă pentru a reîmprospăta datele utilizatorului din baza de date
  const reloadUser = async () => {
    try {
      // Presupunând că ai o rută '/api/profile/me' care returnează datele userului curent
      const response = await api.get('/api/profile/me'); 
      setUser(response.data); // Asta va forța actualizarea meniului!
    } catch (error) {
      console.error("Eroare la reîncărcarea utilizatorului:", error);
    }
  };

  return (
    // ▼▼▼ NOU: Adăugăm 'updateUser' la 'value' ▼▼▼
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
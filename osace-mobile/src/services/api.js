import axios from 'axios';
// ▼▼▼ FIX 1: Importăm SecureStore, nu AsyncStorage ▼▼▼
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const API_URL = __DEV__ 
  ? 'http://100.124.204.20:3000' // Asigură-te că e 3000 aici!
  : 'https://api.osace.ro';
const TOKEN_KEY = 'userToken'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor-ul pentru REQUEST (corectat)
api.interceptors.request.use(
  async (config) => {
    // ▼▼▼ FIX 1: Citim din SecureStore ▼▼▼
    const token = await SecureStore.getItemAsync(TOKEN_KEY); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funcția de setup pentru interceptorul de RĂSPUNS (corectată)
export const setupAxiosInterceptors = (logoutCallback) => {
  let isAlertShown = false; 

  api.interceptors.response.use(
    (response) => response,
    
    async (error) => {
      const { status } = error.response || {};
      
      // ▼▼▼ FIX 2: Obținem URL-ul care a eșuat ▼▼▼
      const failedUrl = error.config.url;
      const ignoreUrls = ['/api/auth/login', '/api/auth/register'];

      // Verificăm dacă este o eroare 401/403
      if ((status === 401 || status === 403) && !isAlertShown) {
        
        // ▼▼▼ FIX 2: Adăugăm condiția de ignorare ▼▼▼
        if (ignoreUrls.includes(failedUrl)) {
          // Dacă e login sau register, NU facem nimic global.
          // Lăsăm eroarea să fie prinsă de LoginScreen.js
        } else {
          // Este o eroare pe un URL protejat, deci sesiunea CHIAR a expirat
          isAlertShown = true; 
          
          Alert.alert(
            "Sesiune Expirată",
            "Sesiunea a expirat! Vă rugăm să vă reconectați.",
            [
              { 
                text: "OK", 
                onPress: () => {
                  logoutCallback();
                  isAlertShown = false; 
                } 
              }
            ]
          );
        }
      }
      
      // Respingem eroarea pentru ca .catch()-ul local să o poată prinde
      return Promise.reject(error);
    }
  );
};

export default api;
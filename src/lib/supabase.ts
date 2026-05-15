import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Pausa el refresh de token cuando la app va a segundo plano y lo reanuda
// al volver al frente. Sin esto, el refresh falla en background y cierra la sesión.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

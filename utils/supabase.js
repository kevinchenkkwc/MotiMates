import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your Supabase project URL and anon key
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://tzudpaukwawoudathfwd.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dWRwYXVrd2F3b3VkYXRoZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzcwNDIsImV4cCI6MjA3OTMxMzA0Mn0._2LAFZ8QY9Pen3_kXFUyV_ddwjW0-PJgYb_goQeeg48';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

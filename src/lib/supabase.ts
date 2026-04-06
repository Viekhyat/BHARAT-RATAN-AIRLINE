import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Prevent top-level crash if URL is invalid/placeholder
const isValidUrl = supabaseUrl.startsWith('http');

export const supabase = isValidUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : new Proxy({} as any, {
        get: () => {
            throw new Error('Supabase client used but not initialized. Check your VITE_SUPABASE_URL in .env');
        }
    });

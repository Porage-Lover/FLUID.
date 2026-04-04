import React, { createContext, useContext, useState, useEffect } from 'react';
import { decryptData } from '../utils/security';
import { THEMES } from '../utils/themes';

export type AppData = {
  user: { name: string; overallAttendance: number; overallMarks: string; };
  attendance: Array<{ name: string; code: string; present: number; absent: number; total: number; percentage: number; }>;
  timetable: { [key: string]: Array<{ time: string; subject: string; code: string; room: string; }> | 'holiday'; };
  marks: Array<{ name: string; code: string; total: string; graph: Array<{ name: string; val: number }>; }>;
  calendar: Array<{ day: string; date: string; title: string; tag: string; type: 'working' | 'regular' | 'holiday' | 'exam'; month: string; }>;
};

const emptyData: AppData = {
  user: { name: '', overallAttendance: 0, overallMarks: '0/0' },
  attendance: [],
  timetable: { "1": [], "2": [], "3": [], "4": [], "5": [] },
  marks: [],
  calendar: []
};

interface DataContextType {
  data: AppData;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  logout: () => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(() => {
    const saved = localStorage.getItem('fluid_theme');
    return THEMES.find(t => t.id === saved) ? saved! : THEMES[0].id;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fluid_theme', theme);
  }, [theme]);


  const fetchCache = async () => {
    setLoading(true);
    const academiaId = sessionStorage.getItem('academia_id');
    const localPayloadStr = sessionStorage.getItem('academia_cache');
    
    if (!academiaId) {
      setLoading(false);
      return;
    }

    try {
      if (localPayloadStr) {
        const decrypted = decryptData(localPayloadStr);
        if (decrypted) {
          const parsed = JSON.parse(decrypted);
          if (parsed) {
            setData(parsed);
            setLoading(false);
            return;
          }
        }
      }
      
      // Secondary fallback ensuring legacy sessions recover gracefully
      const { supabase } = await import('../lib/supabaseClient');
      const { data: dbData, error: dbError } = await supabase
        .from('academia_cache')
        .select('data')
        .eq('id', academiaId)
        .single();

      if (dbError) throw dbError;

      if (dbData && dbData.data) {
        setData(dbData.data as AppData);
      }
    } catch (err: any) {
      console.error('Data pull failed:', err.message);
      setError(err.message);
      setData(emptyData); // Empty fallback ensuring UI doesn't visually crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCache();

    // 🛡️ Sentinel: Legacy Cleanup - Remove plaintext sensitive data from localStorage if it exists
    if (localStorage.getItem('academia_id') || localStorage.getItem('academia_cache')) {
      localStorage.removeItem('academia_id');
      localStorage.removeItem('academia_cache');
      console.log('🛡️ Sentinel: Legacy plaintext storage cleared.');
    }
  }, []);

  const logout = () => {
    // 🛡️ Sentinel: Ensure all sensitive academic data is wiped from memory on logout
    // We clear both sessionStorage (current) and localStorage (legacy/theme) to be safe
    sessionStorage.removeItem('academia_id');
    sessionStorage.removeItem('academia_cache');
    localStorage.removeItem('academia_id');
    localStorage.removeItem('academia_cache');
    window.location.href = '/login';
  };

  return (
    <DataContext.Provider value={{ data, loading, error, refreshData: fetchCache, logout, theme, setTheme }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCache = async () => {
    setLoading(true);
    const academiaId = localStorage.getItem('academia_id');
    
    if (!academiaId) {
      setLoading(false);
      return;
    }

    try {
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
      console.error('Supabase fetch failed:', err.message);
      setError(err.message);
      setData(emptyData); // Empty fallback ensuring UI doesn't visually crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCache();
  }, []);

  const logout = () => {
    localStorage.removeItem('academia_id');
    window.location.href = '/login';
  };

  return (
    <DataContext.Provider value={{ data, loading, error, refreshData: fetchCache, logout }}>
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

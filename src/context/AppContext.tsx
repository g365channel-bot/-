import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Temple, Monk, HealthCheck, ActiveTab, UserRole } from '../types';
import { INITIAL_USERS, INITIAL_TEMPLES, generateInitialData } from '../mockData';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole, templeId?: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonkId: string | null;
  setSelectedMonkId: (id: string | null) => void;
  prefillHealthEntry: { monkId?: string; templeId?: string; year?: number; checkDate?: string; serviceUnit?: string } | null;
  setPrefillHealthEntry: (prefill: { monkId?: string; templeId?: string; year?: number; checkDate?: string; serviceUnit?: string } | null) => void;

  temples: Temple[];
  monks: Monk[];
  healthChecks: HealthCheck[];

  addMonk: (data: { name: string; monkName: string; age: number; monasticYears: number; templeId: string; province: string; birthDate?: string }) => Monk;
  updateMonk: (monk: Monk) => void;
  addHealthCheck: (data: Omit<HealthCheck, 'id' | 'createdAt' | 'updatedAt'>) => HealthCheck;
  updateHealthCheck: (hc: HealthCheck) => void;
  addTemple: (data: Omit<Temple, 'id'>) => Temple;
  updateTemple: (temple: Temple) => void;

  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_TEMPLES = 'monk_health_temples_v1';
const STORAGE_KEY_MONKS = 'monk_health_monks_v1';
const STORAGE_KEY_CHECKS = 'monk_health_checks_v1';
const STORAGE_KEY_USER = 'monk_health_current_user_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing user from storage', e);
      }
    }
    // Default to temple_admin for friendly initial entry, or super_admin
    return INITIAL_USERS[1]; // Wat Bowon user
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMonkId, setSelectedMonkId] = useState<string | null>(null);
  const [prefillHealthEntry, setPrefillHealthEntry] = useState<{
    monkId?: string;
    templeId?: string;
    year?: number;
    checkDate?: string;
    serviceUnit?: string;
  } | null>(null);

  const [temples, setTemples] = useState<Temple[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing temples', e);
      }
    }
    return INITIAL_TEMPLES;
  });

  const [monks, setMonks] = useState<Monk[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MONKS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing monks', e);
      }
    }
    const initial = generateInitialData();
    return initial.monks;
  });

  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CHECKS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing checks', e);
      }
    }
    const initial = generateInitialData();
    return initial.healthChecks;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TEMPLES, JSON.stringify(temples));
  }, [temples]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MONKS, JSON.stringify(monks));
  }, [monks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHECKS, JSON.stringify(healthChecks));
  }, [healthChecks]);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  };

  const switchRole = (role: UserRole, targetTempleId?: string) => {
    if (role === 'super_admin') {
      const admin = INITIAL_USERS[0];
      setCurrentUser(admin);
    } else {
      const tid = targetTempleId || temples[0]?.id || 'T01';
      const temple = temples.find((t) => t.id === tid);
      setCurrentUser({
        id: `U-${tid}`,
        email: `wat.${tid.toLowerCase()}@monkhealth.go.th`,
        name: `ผู้ประสานงาน ${temple?.name || 'ประจำวัด'}`,
        role: 'temple_admin',
        templeId: tid,
        templeName: temple?.name || 'วัดประจำสังกัด',
      });
    }
  };

  const addMonk = (data: {
    name: string;
    monkName: string;
    age: number;
    monasticYears: number;
    templeId: string;
    province: string;
    birthDate?: string;
  }): Monk => {
    const nextNum = monks.length + 1;
    const padNum = nextNum < 10 ? `00${nextNum}` : nextNum < 100 ? `0${nextNum}` : `${nextNum}`;
    const newMonk: Monk = {
      id: `M${padNum}`,
      name: data.name,
      monkName: data.monkName,
      age: Number(data.age),
      monasticYears: Number(data.monasticYears),
      templeId: data.templeId,
      province: data.province,
      birthDate: data.birthDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMonks((prev) => [newMonk, ...prev]);

    // update temple total monks count
    setTemples((prev) =>
      prev.map((t) => (t.id === data.templeId ? { ...t, totalMonks: t.totalMonks + 1 } : t))
    );

    return newMonk;
  };

  const updateMonk = (updated: Monk) => {
    setMonks((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : m))
    );
  };

  const addHealthCheck = (data: Omit<HealthCheck, 'id' | 'createdAt' | 'updatedAt'>): HealthCheck => {
    const id = `HC-${data.year}-${data.monkId}-${Date.now().toString().slice(-4)}`;
    const newCheck: HealthCheck = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If an entry for the same monk and year exists, we can either replace or add.
    // The requirement states: "ห้ามเขียนทับผลตรวจปีก่อน พระรูปเดิมใช้ monkId เดิม ทุกครั้งที่ตรวจต้องสร้างรายการใหม่"
    // If saving the same year again, update that year's record or append.
    setHealthChecks((prev) => {
      const existingIdx = prev.findIndex((hc) => hc.monkId === data.monkId && hc.year === data.year);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = newCheck;
        return next;
      }
      return [newCheck, ...prev];
    });

    return newCheck;
  };

  const updateHealthCheck = (updated: HealthCheck) => {
    setHealthChecks((prev) =>
      prev.map((hc) => (hc.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : hc))
    );
  };

  const addTemple = (data: Omit<Temple, 'id'>): Temple => {
    const nextNum = temples.length + 1;
    const padNum = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const newTemple: Temple = {
      ...data,
      id: `T${padNum}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemples((prev) => [...prev, newTemple]);
    return newTemple;
  };

  const updateTemple = (updated: Temple) => {
    setTemples((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : t))
    );
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(STORAGE_KEY_TEMPLES);
    localStorage.removeItem(STORAGE_KEY_MONKS);
    localStorage.removeItem(STORAGE_KEY_CHECKS);
    const initial = generateInitialData();
    setTemples(INITIAL_TEMPLES);
    setMonks(initial.monks);
    setHealthChecks(initial.healthChecks);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        activeTab,
        setActiveTab,
        selectedMonkId,
        setSelectedMonkId,
        prefillHealthEntry,
        setPrefillHealthEntry,
        temples,
        monks,
        healthChecks,
        addMonk,
        updateMonk,
        addHealthCheck,
        updateHealthCheck,
        addTemple,
        updateTemple,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

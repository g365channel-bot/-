import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Temple, Monk, HealthCheck, ActiveTab, UserRole, Region } from '../types';
import { getRegionFromProvince, StandardRegion9 } from '../utils/regionMapping';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthLoading: boolean;
  logout: () => Promise<void>;
  switchRole: (role: UserRole, templeId?: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonkId: string | null;
  setSelectedMonkId: (id: string | null) => void;
  prefillHealthEntry: { monkId?: string; templeId?: string; year?: number; checkDate?: string; serviceUnit?: string } | null;
  setPrefillHealthEntry: (prefill: { monkId?: string; templeId?: string; year?: number; checkDate?: string; serviceUnit?: string } | null) => void;

  temples: Temple[];
  isTemplesLoading: boolean;
  templesError: string | null;
  refreshTemples: () => Promise<void>;

  monks: Monk[];
  isMonksLoading: boolean;
  monksError: string | null;
  refreshMonks: () => Promise<void>;

  healthChecks: HealthCheck[];
  isHealthChecksLoading: boolean;
  healthChecksError: string | null;
  refreshHealthChecks: () => Promise<void>;

  addMonk: (data: { name: string; monkName: string; age: number; monasticYears: number; templeId: string; province: string; birthDate?: string }) => Promise<Monk>;
  updateMonk: (monk: Monk) => Promise<void>;
  deleteMonk: (id: string) => Promise<void>;
  addHealthCheck: (data: Omit<HealthCheck, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HealthCheck>;
  updateHealthCheck: (hc: HealthCheck) => Promise<void>;
  addTemple: (data: Omit<Temple, 'id'>) => Temple;
  updateTemple: (temple: Temple) => Promise<void>;

  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const formatTimestamp = (val: any): string | undefined => {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  return undefined;
};

const mapDocToTemple = (docId: string, data: any): Temple => {
  return {
    id: docId,
    name: data.name || '',
    subdistrict: data.subdistrict || '',
    district: data.district || '',
    province: data.province || '',
    region: (data.region as Region) || 'กลาง',
    region9: data.region9 || undefined,
    abbotName: data.abbotName || '',
    coordinatorName: data.coordinatorName || '',
    contactPerson: data.contactPerson || data.coordinatorName || undefined,
    phone: data.phone || '',
    healthServiceUnit: data.healthServiceUnit || '',
    totalMonks: typeof data.totalMonks === 'number' ? data.totalMonks : 0,
    status: data.status,
    createdBy: data.createdBy,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),
  };
};

const mapDocToMonk = (docId: string, data: any): Monk => {
  return {
    id: docId,
    name: data.name || '',
    monkName: data.monkName || '',
    birthDate: data.birthDate || undefined,
    age: typeof data.age === 'number' ? data.age : Number(data.age) || 0,
    monasticYears:
      typeof data.monasticYears === 'number' ? data.monasticYears : Number(data.monasticYears) || 0,
    templeId: data.templeId || '',
    province: data.province || '',
    region9: data.region9 || undefined,
    createdAt: formatTimestamp(data.createdAt) || new Date().toISOString(),
    updatedAt: formatTimestamp(data.updatedAt) || new Date().toISOString(),
  };
};

const mapDocToHealthCheck = (docId: string, data: any): HealthCheck => {
  return {
    id: docId,
    monkId: data.monkId || '',
    templeId: data.templeId || '',
    year: typeof data.year === 'number' ? data.year : Number(data.year) || 0,
    checkDate: data.checkDate || '',
    healthServiceUnit: data.healthServiceUnit || '',

    weight: data.weight !== undefined && data.weight !== null ? Number(data.weight) : null,
    height: data.height !== undefined && data.height !== null ? Number(data.height) : null,
    bmi: data.bmi !== undefined && data.bmi !== null ? Number(data.bmi) : null,
    waist: data.waist !== undefined && data.waist !== null ? Number(data.waist) : null,
    systolic: data.systolic !== undefined && data.systolic !== null ? Number(data.systolic) : null,
    diastolic: data.diastolic !== undefined && data.diastolic !== null ? Number(data.diastolic) : null,
    bloodSugar: data.bloodSugar !== undefined && data.bloodSugar !== null ? Number(data.bloodSugar) : null,
    cholesterol: data.cholesterol !== undefined && data.cholesterol !== null ? Number(data.cholesterol) : null,
    triglyceride: data.triglyceride !== undefined && data.triglyceride !== null ? Number(data.triglyceride) : null,
    hdl: data.hdl !== undefined && data.hdl !== null ? Number(data.hdl) : null,
    ldl: data.ldl !== undefined && data.ldl !== null ? Number(data.ldl) : null,
    creatinine: data.creatinine !== undefined && data.creatinine !== null ? Number(data.creatinine) : null,
    egfr: data.egfr !== undefined && data.egfr !== null ? Number(data.egfr) : null,
    uricAcid: data.uricAcid !== undefined && data.uricAcid !== null ? Number(data.uricAcid) : null,

    hasChronicDisease: data.hasChronicDisease || 'none',
    chronicDiseases: Array.isArray(data.chronicDiseases) ? data.chronicDiseases : [],
    otherChronicDisease: data.otherChronicDisease || null,

    sweetFood: data.sweetFood || 'sometimes',
    fattyFood: data.fattyFood || 'sometimes',
    saltyFood: data.saltyFood || 'sometimes',
    spicyFood: data.spicyFood || 'sometimes',
    exerciseTypes: Array.isArray(data.exerciseTypes) ? data.exerciseTypes : ['เดิน'],
    exerciseDaysPerWeek:
      typeof data.exerciseDaysPerWeek === 'number' ? data.exerciseDaysPerWeek : Number(data.exerciseDaysPerWeek) || 0,
    meditationDaysPerWeek:
      typeof data.meditationDaysPerWeek === 'number'
        ? data.meditationDaysPerWeek
        : Number(data.meditationDaysPerWeek) || 0,
    meditationDuration: data.meditationDuration || '15_30',
    smokingStatus: data.smokingStatus || 'never',
    cigarettesPerDay:
      data.cigarettesPerDay !== undefined && data.cigarettesPerDay !== null ? Number(data.cigarettesPerDay) : null,
    sleepHours: data.sleepHours || '7_8',
    sleepQuality: data.sleepQuality || 'sufficient',
    fruitVegetableFrequency: data.fruitVegetableFrequency || '3_4_days',

    healthStatus: data.healthStatus || 'normal',
    followUpRequired: data.followUpRequired || 'no',
    recommendation: data.recommendation || null,

    templeName: data.templeName || '',
    province: data.province || '',
    region: data.region || 'กลาง',
    region9: data.region9 || undefined,

    createdAt: formatTimestamp(data.createdAt) || new Date().toISOString(),
    updatedAt: formatTimestamp(data.updatedAt) || new Date().toISOString(),
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Firebase user state - sourced from Firebase Auth and Firestore users collection
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMonkId, setSelectedMonkId] = useState<string | null>(null);
  const [prefillHealthEntry, setPrefillHealthEntry] = useState<{
    monkId?: string;
    templeId?: string;
    year?: number;
    checkDate?: string;
    serviceUnit?: string;
  } | null>(null);

  // Firestore temples state
  const [temples, setTemples] = useState<Temple[]>([]);
  const [isTemplesLoading, setIsTemplesLoading] = useState<boolean>(false);
  const [templesError, setTemplesError] = useState<string | null>(null);

  // Firestore monks state
  const [monks, setMonks] = useState<Monk[]>([]);
  const [isMonksLoading, setIsMonksLoading] = useState<boolean>(false);
  const [monksError, setMonksError] = useState<string | null>(null);

  // Firestore healthChecks state
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isHealthChecksLoading, setIsHealthChecksLoading] = useState<boolean>(false);
  const [healthChecksError, setHealthChecksError] = useState<string | null>(null);

  // Listen to Firebase Auth state changes to restore or clear real session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          let userDocSnap;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              userDocSnap = await getDoc(userDocRef);
              break;
            } catch (fetchErr: any) {
              const errMsg = fetchErr?.message || '';
              const errCode = fetchErr?.code || '';
              const isOffline =
                errCode === 'unavailable' ||
                errMsg.includes('offline') ||
                errMsg.includes('unavailable');
              if (isOffline && attempt < 2) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
              }
              throw fetchErr;
            }
          }

          if (userDocSnap && userDocSnap.exists()) {
            const userData = userDocSnap.data();

            // Allow access ONLY if active === true and status === 'approved'
            if (userData.active === true && userData.status === 'approved') {
              const appUser: User = {
                id: firebaseUser.uid,
                email: userData.email || firebaseUser.email || '',
                name: userData.name || userData.displayName || 'ผู้ใช้งาน',
                role: (userData.role as UserRole) || 'temple_admin',
                assignedRegion: userData.assignedRegion,
                templeId: userData.templeId,
                templeName: userData.templeName,
              };
              setCurrentUser(appUser);
              setIsAuthLoading(false);
              return;
            } else {
              // Not active or not approved (e.g. status === 'pending') -> sign out immediately
              await signOut(auth);
              setCurrentUser(null);
            }
          } else {
            // Wait brief moment in case user document is currently being created during registration
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const retrySnap = await getDoc(userDocRef);
            if (retrySnap.exists()) {
              const retryData = retrySnap.data();
              if (retryData.active === true && retryData.status === 'approved') {
                const appUser: User = {
                  id: firebaseUser.uid,
                  email: retryData.email || firebaseUser.email || '',
                  name: retryData.name || retryData.displayName || 'ผู้ใช้งาน',
                  role: (retryData.role as UserRole) || 'temple_admin',
                  assignedRegion: retryData.assignedRegion,
                  templeId: retryData.templeId,
                  templeName: retryData.templeName,
                };
                setCurrentUser(appUser);
                setIsAuthLoading(false);
                return;
              }
            }
            // User document does not exist or not approved -> sign out immediately
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (err: any) {
          const isOffline =
            err?.code === 'unavailable' ||
            err?.message?.includes('offline') ||
            err?.message?.includes('unavailable');
          if (isOffline) {
            console.warn('Firestore is currently unreachable or offline. Keeping state until connection restores.');
          } else {
            console.error('Error fetching user document from Firestore:', err);
            await signOut(auth).catch(() => {});
            setCurrentUser(null);
          }
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchTemplesForUser = async (user: User | null) => {
    if (!user) {
      setTemples([]);
      setIsTemplesLoading(false);
      setTemplesError(null);
      return;
    }

    setIsTemplesLoading(true);
    setTemplesError(null);

    try {
      if (user.role === 'super_admin') {
        const q = query(collection(db, 'temples'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        const list: Temple[] = [];
        querySnapshot.forEach((snap) => {
          list.push(mapDocToTemple(snap.id, snap.data()));
        });
        setTemples(list);
      } else if (user.role === 'region_admin') {
        if (!user.assignedRegion) {
          console.warn('[fetchTemplesForUser] Missing assignedRegion for region_admin:', user.id);
          setTemples([]);
          return;
        }
        const q = query(
          collection(db, 'temples'),
          where('status', '==', 'approved'),
          where('region9', '==', user.assignedRegion)
        );
        const querySnapshot = await getDocs(q);
        const list: Temple[] = [];
        querySnapshot.forEach((snap) => {
          list.push(mapDocToTemple(snap.id, snap.data()));
        });
        setTemples(list);
      } else if (user.role === 'temple_admin') {
        if (!user.templeId) {
          setTemples([]);
          return;
        }
        const templeRef = doc(db, 'temples', user.templeId);
        const templeSnap = await getDoc(templeRef);
        if (templeSnap.exists()) {
          const data = templeSnap.data();
          if (data.status === 'approved') {
            setTemples([mapDocToTemple(templeSnap.id, data)]);
          } else {
            setTemples([]);
          }
        } else {
          setTemples([]);
        }
      } else {
        setTemples([]);
      }
    } catch (err: any) {
      console.error('Error loading temples from Firestore:', err);
      setTemplesError(err?.message || 'ไม่สามารถโหลดข้อมูลวัดได้');
      setTemples([]);
    } finally {
      setIsTemplesLoading(false);
    }
  };

  const fetchMonksForUser = async (user: User | null) => {
    if (!user) {
      setMonks([]);
      setIsMonksLoading(false);
      setMonksError(null);
      return;
    }

    setIsMonksLoading(true);
    setMonksError(null);

    try {
      if (user.role === 'super_admin') {
        const monksRef = collection(db, 'monks');
        const querySnapshot = await getDocs(monksRef);
        const list: Monk[] = [];
        querySnapshot.forEach((snap) => {
          list.push(mapDocToMonk(snap.id, snap.data()));
        });
        setMonks(list);
      } else if (user.role === 'region_admin') {
        if (!user.assignedRegion) {
          console.warn('[fetchMonksForUser] Missing assignedRegion for region_admin:', user.id);
          setMonks([]);
          return;
        }
        const q = query(
          collection(db, 'monks'),
          where('region9', '==', user.assignedRegion)
        );
        const querySnapshot = await getDocs(q);
        const list: Monk[] = [];
        querySnapshot.forEach((snap) => {
          list.push(mapDocToMonk(snap.id, snap.data()));
        });
        setMonks(list);
      } else if (user.role === 'temple_admin') {
        if (!user.templeId) {
          setMonks([]);
          return;
        }
        const q = query(collection(db, 'monks'), where('templeId', '==', user.templeId));
        const querySnapshot = await getDocs(q);
        const list: Monk[] = [];
        querySnapshot.forEach((snap) => {
          list.push(mapDocToMonk(snap.id, snap.data()));
        });
        setMonks(list);
      } else {
        setMonks([]);
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied' || String(err?.message || '').includes('permission')) {
        console.error('[PermissionDenied] monk lookup failed:', {
          role: user?.role,
          templeId: user?.templeId,
          error: err,
        });
      } else {
        console.error('Error loading monks from Firestore:', err);
      }
      setMonksError(err?.message || 'ไม่สามารถโหลดข้อมูลพระสงฆ์ได้');
      setMonks([]);
    } finally {
      setIsMonksLoading(false);
    }
  };

  const fetchHealthChecksForUser = async (user: User | null) => {
    // Clear healthChecks state first per requirement
    setHealthChecks([]);
    if (!user) {
      setIsHealthChecksLoading(false);
      setHealthChecksError(null);
      return;
    }

    setIsHealthChecksLoading(true);
    setHealthChecksError(null);

    try {
      if (user.role === 'super_admin') {
        const checksRef = collection(db, 'healthChecks');
        const querySnapshot = await getDocs(checksRef);
        const list: HealthCheck[] = [];
        querySnapshot.forEach((snap) => {
          list.push(mapDocToHealthCheck(snap.id, snap.data()));
        });
        setHealthChecks(list);
      } else if (user.role === 'region_admin') {
        if (!user.assignedRegion) {
          console.warn('[fetchHealthChecksForUser] Missing assignedRegion for region_admin:', user.id);
          setHealthChecks([]);
          return;
        }
        const q = query(
          collection(db, 'healthChecks'),
          where('region9', '==', user.assignedRegion)
        );
        const querySnapshot = await getDocs(q);
        const list: HealthCheck[] = [];
        querySnapshot.forEach((snap) => {
          list.push(mapDocToHealthCheck(snap.id, snap.data()));
        });
        setHealthChecks(list);
      } else if (user.role === 'temple_admin') {
        if (!user.templeId) {
          setHealthChecks([]);
          return;
        }
        // For temple_admin, refreshHealthChecks MUST query only their own temple
        const q = query(
          collection(db, 'healthChecks'),
          where('templeId', '==', user.templeId)
        );
        const querySnapshot = await getDocs(q);
        const list: HealthCheck[] = [];
        querySnapshot.forEach((snap) => {
          list.push(mapDocToHealthCheck(snap.id, snap.data()));
        });
        setHealthChecks(list);
      } else {
        setHealthChecks([]);
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied' || String(err?.message || '').includes('permission')) {
        console.error('[PermissionDenied] healthChecks query failed:', {
          role: user?.role,
          templeId: user?.templeId,
          error: err,
        });
      } else {
        console.error('Error loading healthChecks from Firestore:', err);
      }
      setHealthChecksError(err?.message || 'ไม่สามารถโหลดข้อมูลผลตรวจสุขภาพได้');
      setHealthChecks([]);
    } finally {
      setIsHealthChecksLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTemplesForUser(currentUser);
      fetchMonksForUser(currentUser);
      fetchHealthChecksForUser(currentUser);
    } else {
      setTemples([]);
      setIsTemplesLoading(false);
      setTemplesError(null);
      setMonks([]);
      setIsMonksLoading(false);
      setMonksError(null);
      setHealthChecks([]);
      setIsHealthChecksLoading(false);
      setHealthChecksError(null);
    }
  }, [currentUser?.id, currentUser?.role, currentUser?.templeId, currentUser?.assignedRegion]);

  const refreshTemples = async () => {
    await fetchTemplesForUser(currentUser);
  };

  const refreshMonks = async () => {
    await fetchMonksForUser(currentUser);
  };

  const refreshHealthChecks = async () => {
    await fetchHealthChecksForUser(currentUser);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      setCurrentUser(null);
      setTemples([]);
      setMonks([]);
      setHealthChecks([]);
      setIsTemplesLoading(false);
      setTemplesError(null);
      setIsMonksLoading(false);
      setMonksError(null);
      setIsHealthChecksLoading(false);
      setHealthChecksError(null);
    }
  };

  // Mock switchRole is disabled per requirement
  const switchRole = (_role: UserRole, _targetTempleId?: string) => {
    console.warn('switchRole is disabled: role is strictly determined by Firestore users/{uid}');
  };

  const addMonk = async (data: {
    name: string;
    monkName: string;
    age: number;
    monasticYears: number;
    templeId: string;
    province: string;
    birthDate?: string;
  }): Promise<Monk> => {
    try {
      const selectedTemple = temples.find((t) => t.id === data.templeId);
      let region9: StandardRegion9 | null = null;
      if (selectedTemple) {
        region9 = getRegionFromProvince(selectedTemple.province);
        if (!region9) {
          console.warn(
            `[addMonk] Could not map province "${selectedTemple.province}" from temple "${selectedTemple.name}" (${selectedTemple.id}) to StandardRegion9`
          );
        }
      } else {
        console.warn(
          `[addMonk] Selected temple with id "${data.templeId}" not found in temples list. Cannot derive region9.`
        );
      }

      const monkRef = doc(collection(db, 'monks'));
      const docData: any = {
        name: data.name.trim(),
        monkName: data.monkName.trim(),
        age: Number(data.age),
        monasticYears: Number(data.monasticYears),
        templeId: data.templeId,
        province: data.province,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (data.birthDate) {
        docData.birthDate = data.birthDate;
      }
      if (region9) {
        docData.region9 = region9;
      }

      await setDoc(monkRef, docData);

      const createdMonk: Monk = {
        id: monkRef.id,
        name: docData.name,
        monkName: docData.monkName,
        age: docData.age,
        monasticYears: docData.monasticYears,
        templeId: docData.templeId,
        province: docData.province,
        birthDate: docData.birthDate,
        ...(region9 ? { region9 } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMonks((prev) => [createdMonk, ...prev.filter((m) => m.id !== createdMonk.id)]);
      fetchMonksForUser(currentUser).catch((e) => console.error('Error refreshing monks:', e));

      return createdMonk;
    } catch (err: any) {
      console.error('Error adding monk to Firestore:', err);
      throw err;
    }
  };

  const updateMonk = async (updated: Monk): Promise<void> => {
    try {
      const effectiveTempleId =
        currentUser?.role === 'super_admin' && updated.templeId
          ? updated.templeId
          : updated.templeId;

      const selectedTemple = temples.find((t) => t.id === effectiveTempleId);
      let region9: StandardRegion9 | null = null;
      if (selectedTemple) {
        region9 = getRegionFromProvince(selectedTemple.province);
        if (!region9) {
          console.warn(
            `[updateMonk] Could not map province "${selectedTemple.province}" from temple "${selectedTemple.name}" (${selectedTemple.id}) to StandardRegion9`
          );
        }
      } else {
        console.warn(
          `[updateMonk] Selected temple with id "${effectiveTempleId}" not found in temples list. Cannot derive region9.`
        );
      }

      const monkRef = doc(db, 'monks', updated.id);
      const updateData: any = {
        name: updated.name.trim(),
        monkName: updated.monkName.trim(),
        age: Number(updated.age),
        monasticYears: Number(updated.monasticYears),
        province: updated.province,
        updatedAt: serverTimestamp(),
      };
      if (updated.birthDate) {
        updateData.birthDate = updated.birthDate;
      }
      if (currentUser?.role === 'super_admin' && updated.templeId) {
        updateData.templeId = updated.templeId;
      }
      if (region9) {
        updateData.region9 = region9;
      }

      await updateDoc(monkRef, updateData);

      setMonks((prev) =>
        prev.map((m) =>
          m.id === updated.id
            ? {
                ...updated,
                ...(region9 ? { region9 } : {}),
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
      fetchMonksForUser(currentUser).catch((e) => console.error('Error refreshing monks:', e));
    } catch (err: any) {
      console.error('Error updating monk in Firestore:', err);
      throw err;
    }
  };

  const deleteMonk = async (id: string): Promise<void> => {
    try {
      const monkRef = doc(db, 'monks', id);
      await deleteDoc(monkRef);
      setMonks((prev) => prev.filter((m) => m.id !== id));
      setHealthChecks((prev) => prev.filter((hc) => hc.monkId !== id));
      fetchMonksForUser(currentUser).catch((e) => console.error('Error refreshing monks:', e));
    } catch (err: any) {
      console.error('Error deleting monk in Firestore:', err);
      throw err;
    }
  };

  const addHealthCheck = async (
    data: Omit<HealthCheck, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<HealthCheck> => {
    const monk = monks.find((m) => m.id === data.monkId);

    // 4. temple_admin must force: payload.templeId = currentUser.templeId
    // Never use temples[0], fallback IDs, or a stale selected temple.
    let payloadTempleId = data.templeId;
    if (currentUser?.role === 'temple_admin') {
      if (!currentUser.templeId) {
        throw new Error('ไม่พบรหัสวัดของผู้ดูแลวัด (currentUser.templeId is missing)');
      }
      payloadTempleId = currentUser.templeId;
    } else if (!payloadTempleId) {
      payloadTempleId = monk?.templeId || '';
    }

    // 3. Before saving, verify and log temporarily:
    console.log("currentUser.templeId", currentUser?.templeId);
    console.log("monk.templeId", monk?.templeId);
    console.log("payload.templeId", payloadTempleId);
    console.log("monkId", data.monkId);
    console.log("year", data.year);

    // 2. Use the healthChecks state to determine whether an exact record already exists:
    const existingCheck = healthChecks.find(
      (hc) =>
        hc.monkId === data.monkId &&
        Number(hc.year) === Number(data.year)
    );

    // Then use deterministic ID:
    const checkId = `${data.monkId}_${data.year}`;
    const ref = doc(db, "healthChecks", checkId);

    const yearNum = Number(data.year);
    const templeObj = temples.find((t) => t.id === payloadTempleId);
    const templeName = data.templeName || templeObj?.name || '';
    const province = data.province || templeObj?.province || monk?.province || '';
    const region = data.region || templeObj?.region || 'กลาง';

    let region9: StandardRegion9 | null = null;
    if (templeObj) {
      region9 = getRegionFromProvince(templeObj.province);
      if (!region9) {
        console.warn(
          `[addHealthCheck] Could not map province "${templeObj.province}" from temple "${templeObj.name}" (${templeObj.id}) to StandardRegion9`
        );
      }
    } else {
      console.warn(
        `[addHealthCheck] Selected temple with id "${payloadTempleId}" not found in temples list. Cannot derive region9.`
      );
    }

    const sanitizeNum = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const payload: Record<string, any> = {
      monkId: data.monkId,
      templeId: payloadTempleId,
      year: yearNum,
      checkDate: data.checkDate || '',
      healthServiceUnit: data.healthServiceUnit || templeObj?.healthServiceUnit || 'หน่วยบริการสุขภาพ',

      // Section 2: Health Measurements (null if blank, never 0 for empty, never undefined)
      weight: sanitizeNum(data.weight),
      height: sanitizeNum(data.height),
      bmi: sanitizeNum(data.bmi),
      waist: sanitizeNum(data.waist),
      systolic: sanitizeNum(data.systolic),
      diastolic: sanitizeNum(data.diastolic),
      bloodSugar: sanitizeNum(data.bloodSugar),
      cholesterol: sanitizeNum(data.cholesterol),
      triglyceride: sanitizeNum(data.triglyceride),
      hdl: sanitizeNum(data.hdl),
      ldl: sanitizeNum(data.ldl),
      creatinine: sanitizeNum(data.creatinine),
      egfr: sanitizeNum(data.egfr),
      uricAcid: sanitizeNum(data.uricAcid),

      // Section 3: Chronic Diseases
      hasChronicDisease: data.hasChronicDisease || 'none',
      chronicDiseases: Array.isArray(data.chronicDiseases) ? data.chronicDiseases : [],
      otherChronicDisease:
        data.hasChronicDisease === 'has' && data.otherChronicDisease ? data.otherChronicDisease.trim() : null,

      // Section 4: Health Behaviors
      sweetFood: data.sweetFood || 'sometimes',
      fattyFood: data.fattyFood || 'sometimes',
      saltyFood: data.saltyFood || 'sometimes',
      spicyFood: data.spicyFood || 'sometimes',
      exerciseTypes: Array.isArray(data.exerciseTypes) ? data.exerciseTypes : ['เดิน'],
      exerciseDaysPerWeek:
        typeof data.exerciseDaysPerWeek === 'number'
          ? data.exerciseDaysPerWeek
          : Number(data.exerciseDaysPerWeek) || 0,
      meditationDaysPerWeek:
        typeof data.meditationDaysPerWeek === 'number'
          ? data.meditationDaysPerWeek
          : Number(data.meditationDaysPerWeek) || 0,
      meditationDuration: data.meditationDuration || '15_30',
      smokingStatus: data.smokingStatus || 'never',
      cigarettesPerDay: data.smokingStatus === 'smoking' ? sanitizeNum(data.cigarettesPerDay) : null,
      sleepHours: data.sleepHours || '7_8',
      sleepQuality: data.sleepQuality || 'sufficient',
      fruitVegetableFrequency: data.fruitVegetableFrequency || '3_4_days',

      // Section 5: Summary
      healthStatus: data.healthStatus || 'normal',
      followUpRequired: data.followUpRequired || 'no',
      recommendation: data.recommendation ? data.recommendation.trim() || null : null,

      // Required location fields
      templeName,
      province,
      region,
      ...(region9 ? { region9 } : {}),

      updatedAt: serverTimestamp(),
    };

    // If existingCheck does not exist: include createdAt = serverTimestamp()
    // If existingCheck exists: do not overwrite createdAt
    if (!existingCheck) {
      payload.createdAt = serverTimestamp();
    }

    try {
      // Use setDoc(ref, payload, { merge: true });
      await setDoc(ref, payload, { merge: true });
    } catch (err: any) {
      if (err?.code === 'permission-denied' || String(err?.message || '').includes('permission')) {
        console.error('[PermissionDenied] setDoc create/update operation failed:', {
          checkId,
          monkId: data.monkId,
          year: data.year,
          payloadTempleId,
          currentUserTempleId: currentUser?.templeId,
          currentUserRole: currentUser?.role,
          error: err,
        });
      } else {
        console.error('Error in setDoc for healthChecks:', err);
      }
      throw err;
    }

    const optimisticCheck: HealthCheck = {
      ...data,
      id: checkId,
      monkId: data.monkId,
      templeId: payloadTempleId,
      year: yearNum,
      checkDate: payload.checkDate,
      healthServiceUnit: payload.healthServiceUnit,
      weight: payload.weight,
      height: payload.height,
      bmi: payload.bmi,
      waist: payload.waist,
      systolic: payload.systolic,
      diastolic: payload.diastolic,
      bloodSugar: payload.bloodSugar,
      cholesterol: payload.cholesterol,
      triglyceride: payload.triglyceride,
      hdl: payload.hdl,
      ldl: payload.ldl,
      creatinine: payload.creatinine,
      egfr: payload.egfr,
      uricAcid: payload.uricAcid,
      hasChronicDisease: payload.hasChronicDisease,
      chronicDiseases: payload.chronicDiseases,
      otherChronicDisease: payload.otherChronicDisease,
      sweetFood: payload.sweetFood,
      fattyFood: payload.fattyFood,
      saltyFood: payload.saltyFood,
      spicyFood: payload.spicyFood,
      exerciseTypes: payload.exerciseTypes,
      exerciseDaysPerWeek: payload.exerciseDaysPerWeek,
      meditationDaysPerWeek: payload.meditationDaysPerWeek,
      meditationDuration: payload.meditationDuration,
      smokingStatus: payload.smokingStatus,
      cigarettesPerDay: payload.cigarettesPerDay,
      sleepHours: payload.sleepHours,
      sleepQuality: payload.sleepQuality,
      fruitVegetableFrequency: payload.fruitVegetableFrequency,
      healthStatus: payload.healthStatus,
      followUpRequired: payload.followUpRequired,
      recommendation: payload.recommendation,
      templeName,
      province,
      region,
      ...(region9 ? { region9 } : {}),
      createdAt: existingCheck ? existingCheck.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setHealthChecks((prev) => {
      const remaining = prev.filter(
        (hc) => hc.id !== checkId && !(hc.monkId === data.monkId && Number(hc.year) === yearNum)
      );
      return [optimisticCheck, ...remaining];
    });

    return optimisticCheck;
  };

  const updateHealthCheck = async (updated: HealthCheck): Promise<void> => {
    const yearNum = Number(updated.year);
    const docId = updated.id || `${updated.monkId}_${yearNum}`;
    const checkRef = doc(db, 'healthChecks', docId);

    const monk = monks.find((m) => m.id === updated.monkId);
    let payloadTempleId = updated.templeId;
    if (currentUser?.role === 'temple_admin') {
      if (!currentUser.templeId) {
        throw new Error('ไม่พบรหัสวัดของผู้ดูแลวัด (currentUser.templeId is missing)');
      }
      payloadTempleId = currentUser.templeId;
    } else if (!payloadTempleId) {
      payloadTempleId = monk?.templeId || '';
    }

    const templeObj = temples.find((t) => t.id === payloadTempleId);
    let region9: StandardRegion9 | null = null;
    if (templeObj) {
      region9 = getRegionFromProvince(templeObj.province);
      if (!region9) {
        console.warn(
          `[updateHealthCheck] Could not map province "${templeObj.province}" from temple "${templeObj.name}" (${templeObj.id}) to StandardRegion9`
        );
      }
    } else {
      console.warn(
        `[updateHealthCheck] Selected temple with id "${payloadTempleId}" not found in temples list. Cannot derive region9.`
      );
    }

    console.log("currentUser.templeId", currentUser?.templeId);
    console.log("monk.templeId", monk?.templeId);
    console.log("payload.templeId", payloadTempleId);
    console.log("monkId", updated.monkId);
    console.log("year", updated.year);

    const existingCheck = healthChecks.find(
      (hc) =>
        hc.id === docId ||
        (hc.monkId === updated.monkId && Number(hc.year) === yearNum)
    );

    const sanitizeNum = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const firestoreData: Record<string, any> = {
      monkId: updated.monkId,
      templeId: payloadTempleId,
      year: yearNum,
      checkDate: updated.checkDate || '',
      healthServiceUnit: updated.healthServiceUnit || '',

      weight: sanitizeNum(updated.weight),
      height: sanitizeNum(updated.height),
      bmi: sanitizeNum(updated.bmi),
      waist: sanitizeNum(updated.waist),
      systolic: sanitizeNum(updated.systolic),
      diastolic: sanitizeNum(updated.diastolic),
      bloodSugar: sanitizeNum(updated.bloodSugar),
      cholesterol: sanitizeNum(updated.cholesterol),
      triglyceride: sanitizeNum(updated.triglyceride),
      hdl: sanitizeNum(updated.hdl),
      ldl: sanitizeNum(updated.ldl),
      creatinine: sanitizeNum(updated.creatinine),
      egfr: sanitizeNum(updated.egfr),
      uricAcid: sanitizeNum(updated.uricAcid),

      hasChronicDisease: updated.hasChronicDisease || 'none',
      chronicDiseases: Array.isArray(updated.chronicDiseases) ? updated.chronicDiseases : [],
      otherChronicDisease:
        updated.hasChronicDisease === 'has' && updated.otherChronicDisease
          ? updated.otherChronicDisease.trim()
          : null,

      sweetFood: updated.sweetFood || 'sometimes',
      fattyFood: updated.fattyFood || 'sometimes',
      saltyFood: updated.saltyFood || 'sometimes',
      spicyFood: updated.spicyFood || 'sometimes',
      exerciseTypes: Array.isArray(updated.exerciseTypes) ? updated.exerciseTypes : ['เดิน'],
      exerciseDaysPerWeek:
        typeof updated.exerciseDaysPerWeek === 'number'
          ? updated.exerciseDaysPerWeek
          : Number(updated.exerciseDaysPerWeek) || 0,
      meditationDaysPerWeek:
        typeof updated.meditationDaysPerWeek === 'number'
          ? updated.meditationDaysPerWeek
          : Number(updated.meditationDaysPerWeek) || 0,
      meditationDuration: updated.meditationDuration || '15_30',
      smokingStatus: updated.smokingStatus || 'never',
      cigarettesPerDay: updated.smokingStatus === 'smoking' ? sanitizeNum(updated.cigarettesPerDay) : null,
      sleepHours: updated.sleepHours || '7_8',
      sleepQuality: updated.sleepQuality || 'sufficient',
      fruitVegetableFrequency: updated.fruitVegetableFrequency || '3_4_days',

      healthStatus: updated.healthStatus || 'normal',
      followUpRequired: updated.followUpRequired || 'no',
      recommendation: updated.recommendation ? updated.recommendation.trim() || null : null,

      templeName: updated.templeName || '',
      province: updated.province || '',
      region: updated.region || 'กลาง',
      ...(region9 ? { region9 } : {}),

      updatedAt: serverTimestamp(),
    };

    if (!existingCheck) {
      firestoreData.createdAt = serverTimestamp();
    }

    try {
      await setDoc(checkRef, firestoreData, { merge: true });
    } catch (err: any) {
      if (err?.code === 'permission-denied' || String(err?.message || '').includes('permission')) {
        console.error('[PermissionDenied] setDoc create/update operation failed:', {
          operation: 'setDoc healthChecks in updateHealthCheck',
          docId,
          monkId: updated.monkId,
          year: updated.year,
          payloadTempleId,
          currentUserTempleId: currentUser?.templeId,
          currentUserRole: currentUser?.role,
          error: err,
        });
      } else {
        console.error('Error updating healthCheck in Firestore:', err);
      }
      throw err;
    }

    const updatedCheck: HealthCheck = {
      ...updated,
      id: docId,
      templeId: payloadTempleId,
      ...(region9 ? { region9 } : {}),
      updatedAt: new Date().toISOString(),
    };

    setHealthChecks((prev) =>
      prev.map((hc) => (hc.id === docId ? updatedCheck : hc))
    );
  };

  const addTemple = (data: Omit<Temple, 'id'>): Temple => {
    console.warn('addTemple: direct creation without Auth is disabled. Temples must register.');
    return {
      ...data,
      id: 'temp-' + Date.now(),
    };
  };

  const updateTemple = async (updated: Temple): Promise<void> => {
    try {
      const effectiveProvince = updated.province || '';
      let region9: StandardRegion9 | null = null;
      if (effectiveProvince) {
        region9 = getRegionFromProvince(effectiveProvince);
        if (!region9) {
          console.warn(
            `[updateTemple] Could not map province "${effectiveProvince}" for temple "${updated.name}" (${updated.id}) to StandardRegion9`
          );
        }
      } else {
        console.warn(
          `[updateTemple] Temple "${updated.name}" (${updated.id}) has no province specified. Cannot derive region9.`
        );
      }

      const updateData: Record<string, any> = {
        name: updated.name,
        subdistrict: updated.subdistrict || '',
        district: updated.district || '',
        province: effectiveProvince,
        region: updated.region || 'กลาง',
        healthServiceUnit: updated.healthServiceUnit || '',
        contactPerson: updated.contactPerson || updated.coordinatorName || '',
        phone: updated.phone || '',
        abbotName: updated.abbotName || '',
        coordinatorName: updated.coordinatorName || updated.contactPerson || '',
        updatedAt: serverTimestamp(),
      };

      if (region9) {
        updateData.region9 = region9;
      }

      const templeRef = doc(db, 'temples', updated.id);
      await updateDoc(templeRef, updateData);

      // Refresh temple data after success
      await fetchTemplesForUser(currentUser);
    } catch (err: any) {
      console.error('Error updating temple in Firestore:', err);
      throw err;
    }
  };

  const resetToDefaultData = () => {
    if (currentUser) {
      fetchTemplesForUser(currentUser);
      fetchMonksForUser(currentUser);
      fetchHealthChecksForUser(currentUser);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthLoading,
        logout,
        switchRole,
        activeTab,
        setActiveTab,
        selectedMonkId,
        setSelectedMonkId,
        prefillHealthEntry,
        setPrefillHealthEntry,
        temples,
        isTemplesLoading,
        templesError,
        refreshTemples,
        monks,
        isMonksLoading,
        monksError,
        refreshMonks,
        healthChecks,
        isHealthChecksLoading,
        healthChecksError,
        refreshHealthChecks,
        addMonk,
        updateMonk,
        deleteMonk,
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

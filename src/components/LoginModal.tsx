import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  HeartPulse,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Building2,
  MapPin,
  User as UserIcon,
  Phone,
  Stethoscope,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, UserRole, Region } from '../types';
import { getRegionFromProvince } from '../utils/regionMapping';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const REGIONS: Region[] = ['กลาง', 'เหนือ', 'ตะวันออกเฉียงเหนือ', 'ใต้', 'ตะวันออก', 'ตะวันตก'];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { setCurrentUser } = useApp();

  // Mode: 'login' | 'register' | 'forgot' | 'register_success'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot' | 'register_success'>(
    initialMode
  );

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode(initialMode);
      setError(null);
      setRegError(null);
      setForgotError(null);
      setForgotSent(false);
    }
  }, [isOpen, initialMode]);

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Registration form states
  const [coordinatorName, setCoordinatorName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [templeName, setTempleName] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [region, setRegion] = useState<Region>('กลาง');
  const [abbotName, setAbbotName] = useState('');
  const [phone, setPhone] = useState('');
  const [healthServiceUnit, setHealthServiceUnit] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Firebase Email/Password authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const firebaseUser = userCredential.user;
      const uid = firebaseUser.uid;

      // 2. Read Firestore document: users/{uid}
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await signOut(auth);
        setIsLoading(false);
        setError('ไม่พบข้อมูลผู้ใช้งานในระบบ');
        return;
      }

      const userData = userDocSnap.data();

      // 3. Check active state
      if (userData.active === false) {
        await signOut(auth);
        setIsLoading(false);
        setError('บัญชีนี้ถูกระงับการใช้งาน');
        return;
      }

      // 4. Requirement 8: If status === "pending", sign out and show:
      // "บัญชีของท่านอยู่ระหว่างรอการอนุมัติ"
      if (userData.status === 'pending') {
        await signOut(auth);
        setIsLoading(false);
        setError('บัญชีของท่านอยู่ระหว่างรอการอนุมัติ');
        return;
      }

      if (userData.status !== 'approved') {
        await signOut(auth);
        setIsLoading(false);
        setError('บัญชีนี้ยังไม่ได้รับการอนุมัติ');
        return;
      }

      // 5. Map the Firestore user document to User object
      const appUser: User = {
        id: uid,
        email: userData.email || firebaseUser.email || cleanEmail,
        name: userData.name || userData.displayName || 'ผู้ใช้งาน',
        role: (userData.role as UserRole) || 'temple_admin',
        templeId: userData.templeId || undefined,
        templeName: userData.templeName || undefined,
      };

      setCurrentUser(appUser);
      setIsLoading(false);
      onClose();
    } catch (authErr: any) {
      await signOut(auth).catch(() => {});
      setIsLoading(false);

      const code = authErr?.code || '';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials'
      ) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (code === 'auth/user-disabled') {
        setError('บัญชีนี้ถูกระงับการใช้งาน');
      } else if (code === 'auth/too-many-requests') {
        setError('มีการพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่');
      } else if (
        code === 'auth/network-request-failed' ||
        code === 'unavailable' ||
        authErr?.message?.includes('offline') ||
        authErr?.message?.includes('unavailable')
      ) {
        setError('ไม่สามารถเชื่อมต่อกับระบบได้ในขณะนี้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง');
      } else {
        setError(authErr?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    }
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setForgotError('กรุณากรอกอีเมล');
      return;
    }

    setForgotLoading(true);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setForgotLoading(false);
      setForgotSent(true);
    } catch (err: any) {
      setForgotLoading(false);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setForgotError('ไม่พบอีเมลนี้ในระบบ');
      } else if (code === 'auth/invalid-email') {
        setForgotError('รูปแบบอีเมลไม่ถูกต้อง');
      } else {
        setForgotError(err?.message || 'เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน');
      }
    }
  };

  // Handle Temple Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const cName = coordinatorName.trim();
    const cEmail = regEmail.trim();
    const cPassword = regPassword;
    const cConfirmPassword = regConfirmPassword;
    const tName = templeName.trim();
    const tSubdistrict = subdistrict.trim();
    const tDistrict = district.trim();
    const tProvince = province.trim();
    const tRegion = region;
    const tAbbotName = abbotName.trim();
    const tPhone = phone.trim();
    const tHealthServiceUnit = healthServiceUnit.trim();

    // Required fields check
    if (!cName) {
      setRegError('กรุณาระบุชื่อผู้ประสานงาน');
      return;
    }
    if (!cEmail) {
      setRegError('กรุณาระบุอีเมล');
      return;
    }
    if (!cPassword) {
      setRegError('กรุณาระบุรหัสผ่าน');
      return;
    }
    if (cPassword.length < 6) {
      setRegError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (cPassword !== cConfirmPassword) {
      setRegError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (!tName) {
      setRegError('กรุณาระบุชื่อวัด');
      return;
    }
    if (!tSubdistrict) {
      setRegError('กรุณาระบุตำบล');
      return;
    }
    if (!tDistrict) {
      setRegError('กรุณาระบุอำเภอ');
      return;
    }
    if (!tProvince) {
      setRegError('กรุณาระบุจังหวัด');
      return;
    }
    if (!tAbbotName) {
      setRegError('กรุณาระบุชื่อเจ้าอาวาส');
      return;
    }
    if (!tPhone) {
      setRegError('กรุณาระบุเบอร์โทรศัพท์');
      return;
    }

    // Derive standard 9-region from province (no fallback values)
    const derivedRegion9 = getRegionFromProvince(tProvince);
    if (!derivedRegion9) {
      console.warn(`[Registration] Province "${tProvince}" could not be mapped to Region9; omitting region9`);
    }

    setRegLoading(true);
    setRegError(null);

    const t0 = performance.now();

    try {
      // 4. Use Firebase: createUserWithEmailAndPassword(auth, email, password)
      const userCredential = await createUserWithEmailAndPassword(auth, cEmail, cPassword);
      const tAuth = performance.now();
      console.log(`Auth creation: ${(tAuth - t0).toFixed(1)} ms`);

      const uid = userCredential.user.uid;

      // 5. Create users/{uid} and temples/{uid} using ONE Firestore writeBatch
      // Do not perform unnecessary Firestore reads before batch.commit()
      const batch = writeBatch(db);

      batch.set(doc(db, 'users', uid), {
        name: cName,
        email: cEmail,
        role: 'temple_admin',
        status: 'pending',
        active: true,
        templeId: uid,
        createdAt: serverTimestamp(),
      });

      batch.set(doc(db, 'temples', uid), {
        name: tName,
        subdistrict: tSubdistrict,
        district: tDistrict,
        province: tProvince,
        region: tRegion,
        ...(derivedRegion9 ? { region9: derivedRegion9 } : {}),
        abbotName: tAbbotName,
        coordinatorName: cName,
        phone: tPhone,
        healthServiceUnit: tHealthServiceUnit || '',
        totalMonks: 0,
        status: 'pending',
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const tBatchStart = performance.now();
      await batch.commit();
      const tBatchEnd = performance.now();

      console.log(`Firestore batch: ${(tBatchEnd - tBatchStart).toFixed(1)} ms`);
      console.log(`Total registration: ${(tBatchEnd - t0).toFixed(1)} ms`);

      // 6. After successful registration batch commit: sign the user out
      await signOut(auth);

      // 7. Only show registration success after batch.commit() succeeds
      setRegLoading(false);
      setViewMode('register_success');
    } catch (err: any) {
      console.error('Registration failed:', err);
      await signOut(auth).catch(() => {});
      setRegLoading(false);

      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setRegError('อีเมลนี้ถูกใช้งานในระบบแล้ว กรุณาใช้อีเมลอื่น');
      } else if (code === 'auth/invalid-email') {
        setRegError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (code === 'auth/weak-password') {
        setRegError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      } else if (code === 'permission-denied') {
        setRegError('ไม่มีสิทธิ์ในการบันทึกข้อมูล กรุณาตรวจสอบข้อมูลหรือติดต่อผู้ดูแลระบบ');
      } else if (code === 'unavailable') {
        setRegError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง');
      } else {
        setRegError(err?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  const modalWidthClass =
    viewMode === 'register'
      ? 'max-w-2xl'
      : viewMode === 'register_success'
      ? 'max-w-md'
      : 'max-w-md';

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${modalWidthClass} max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 transition-all`}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-5 sm:p-6 text-center relative shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner mb-2.5">
            {viewMode === 'register' ? (
              <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
            ) : (
              <HeartPulse className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
            ระบบฐานข้อมูลสุขภาพพระสงฆ์
          </h2>
          <p className="text-emerald-200 text-xs mt-1">
            {viewMode === 'register'
              ? 'ลงทะเบียนบัญชีผู้ดูแลสำหรับวัดใหม่ (รอการอนุมัติสิทธิ์)'
              : viewMode === 'forgot'
              ? 'ส่งลิงก์ตั้งค่ารหัสผ่านใหม่ไปยังอีเมลของท่าน'
              : viewMode === 'register_success'
              ? 'ส่งคำขอลงทะเบียนเรียบร้อยแล้ว'
              : 'เข้าสู่ระบบบันทึกและติดตามข้อมูลสุขภาพ'}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* VIEW 1: REGISTER SUCCESS */}
          {viewMode === 'register_success' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-2xl text-center space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  ส่งคำขอสมัครเรียบร้อยแล้ว
                </h3>
                {/* Requirement 7: Show exact message */}
                <p className="text-sm font-semibold text-emerald-800 mt-2 bg-white/80 border border-emerald-300/80 px-4 py-2.5 rounded-xl shadow-xs">
                  ส่งคำขอสมัครเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบอนุมัติ
                </p>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                ระบบได้รับข้อมูลของ <span className="font-semibold text-stone-800">{templeName}</span> แล้ว เมื่อผู้ดูแลระบบ (Super Admin) ตรวจสอบและอนุมัติสิทธิ์ ท่านจะสามารถเข้าสู่ระบบเพื่อใช้งานได้ทันที
              </p>
              <div className="pt-2">
                <button
                  id="reg-success-back-btn"
                  onClick={() => {
                    setViewMode('login');
                    setError(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>กลับไปหน้าเข้าสู่ระบบ</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: REGISTER FORM */}
          {viewMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div className="flex items-center gap-2 text-stone-800 font-semibold text-sm">
                  <Building2 className="w-4 h-4 text-emerald-800" />
                  <span>แบบฟอร์มสมัครใช้งานสำหรับวัด</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setRegError(null);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 inline-flex items-center gap-1 cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-3 h-3" />
                  กลับไปเข้าสู่ระบบ
                </button>
              </div>

              {regError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Section 1: ข้อมูลวัด */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ข้อมูลวัดและที่ตั้ง</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชื่อวัด <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-temple-name"
                    type="text"
                    value={templeName}
                    onChange={(e) => setTempleName(e.target.value)}
                    placeholder="เช่น วัดบวรนิเวศวิหาร"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ชื่อเจ้าอาวาส <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-abbot-name"
                    type="text"
                    value={abbotName}
                    onChange={(e) => setAbbotName(e.target.value)}
                    placeholder="เช่น สมเด็จพระวันรัต"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      ตำบล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-subdistrict"
                      type="text"
                      value={subdistrict}
                      onChange={(e) => setSubdistrict(e.target.value)}
                      placeholder="เช่น บวรนิเวศ"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      อำเภอ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-district"
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="เช่น พระนคร"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      จังหวัด <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-province"
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="เช่น กรุงเทพมหานคร"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      ภาค <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="reg-region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value as Region)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm bg-white"
                      required
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          ภาค{r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    หน่วยบริการสุขภาพที่ดูแล (ไม่บังคับ)
                  </label>
                  <div className="relative">
                    <Stethoscope className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      id="reg-health-service-unit"
                      type="text"
                      value={healthServiceUnit}
                      onChange={(e) => setHealthServiceUnit(e.target.value)}
                      placeholder="เช่น โรงพยาบาลสงฆ์ หรือ รพ.สต. ในพื้นที่"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: ข้อมูลผู้ประสานงานและบัญชี */}
              <div className="space-y-3 pt-3 border-t border-stone-200">
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ข้อมูลผู้ประสานงานและบัญชีผู้ใช้</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      ชื่อผู้ประสานงาน <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-coordinator-name"
                      type="text"
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      placeholder="เช่น พระมหาประสิทธิ์ ธมฺมรังสี"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        id="reg-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="เช่น 02-281-2831 หรือ 081-xxx-xxxx"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    อีเมล (ใช้เป็นบัญชีเข้าสู่ระบบ) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="wat.example@monkhealth.go.th"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                        aria-label={showRegPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        id="reg-confirm-password"
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs sm:text-sm font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                        aria-label={showRegConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showRegConfirmPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900 leading-relaxed">
                  ℹ️ เมื่อลงทะเบียนแล้ว บัญชีจะได้รับบทบาท <strong>ผู้ดูแลประจำวัด (Temple Admin)</strong> ในสถานะ <strong>รอการอนุมัติ (pending)</strong> โดยท่านจะสามารถเข้าสู่ระบบได้หลังจากผู้ดูแลระบบส่วนกลางตรวจสอบและอนุมัติสิทธิ์แล้ว
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="reg-submit-btn"
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {regLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งคำขอลงทะเบียน...</span>
                    </>
                  ) : (
                    <span>ส่งคำขอลงทะเบียนวัด</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
          {viewMode === 'forgot' &&
            (forgotSent ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="font-semibold text-sm">ส่งลิงก์ตั้งค่ารหัสผ่านใหม่เรียบร้อยแล้ว</div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  กรุณาตรวจสอบข้อความในกล่องจดหมายอีเมล{' '}
                  <span className="font-semibold text-emerald-900">{forgotEmail}</span>{' '}
                  เพื่อดำเนินการตั้งรหัสผ่านใหม่
                </p>
                <button
                  id="forgot-back-btn"
                  onClick={() => {
                    setViewMode('login');
                    setForgotSent(false);
                    setForgotError(null);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold hover:text-emerald-950 underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-700">รีเซ็ตรหัสผ่าน</span>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setForgotError(null);
                    }}
                    className="text-xs text-stone-500 hover:text-stone-800 inline-flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    กลับไปเข้าสู่ระบบ
                  </button>
                </div>

                {forgotError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    อีเมลที่ลงทะเบียนในระบบ
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      id="forgot-email-input"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="example@monkhealth.go.th"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งลิงก์...</span>
                    </>
                  ) : (
                    <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
                  )}
                </button>
              </form>
            ))}

          {/* VIEW 4: LOGIN FORM */}
          {viewMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="login-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@monkhealth.go.th"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setViewMode('forgot');
                      setForgotError(null);
                      setForgotSent(false);
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 hover:underline font-medium cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm font-sans"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-600 text-white font-semibold rounded-xl text-base transition-colors shadow-sm cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <span>เข้าสู่ระบบ</span>
                )}
              </button>

              {/* Requirement 1: Add a button on the login screen: "สมัครใช้งานสำหรับวัด" */}
              <div className="pt-3 border-t border-stone-200 text-center">
                <p className="text-xs text-stone-500 mb-2">ยังไม่มีบัญชีสำหรับวัดของท่าน?</p>
                <button
                  type="button"
                  id="open-register-btn"
                  onClick={() => {
                    setViewMode('register');
                    setError(null);
                    setRegError(null);
                  }}
                  className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-amber-700" />
                  <span>สมัครใช้งานสำหรับวัด</span>
                </button>
              </div>

              {/* Privacy Notice */}
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-center text-xs text-stone-600 leading-tight">
                🔒 ข้อมูลสุขภาพเป็นข้อมูลส่วนบุคคล กรุณาใช้งานอย่างเหมาะสม
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-5 sm:px-6 py-3 border-t border-stone-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-400 font-mono">
            {viewMode === 'register' ? 'Temple Self-Registration' : 'Monk Health DB'}
          </span>
          <button
            onClick={onClose}
            className="text-xs text-stone-600 hover:text-stone-800 font-medium px-3 py-1.5 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

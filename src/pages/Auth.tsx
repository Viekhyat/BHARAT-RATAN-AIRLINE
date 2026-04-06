import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { adminAuth } from '../lib/adminFirebase';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Plane, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const { user, isAdmin, setUser, setIsAdmin, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const currentAuth = isAdminMode ? adminAuth : auth;
        const userCredential = await signInWithEmailAndPassword(currentAuth, email, password);

        // Immediate State Push (for instant redirection)
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
          role: isAdminMode ? 'admin' : 'user' as const
        };
        // @ts-ignore
        setUser(userData);
        setIsAdmin(isAdminMode);

        // Manual Cache Push (The "Catch")
        localStorage.setItem('auth_cache', JSON.stringify(userData));
        localStorage.setItem('is_admin_cache', isAdminMode.toString());

        toast.success(isAdminMode ? 'Staff Authenticated. Accessing Command Center...' : 'Welcome back to Bharat Ratan Airlines!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });

        const userData = { uid: userCredential.user.uid, email: userCredential.user.email, displayName: name, role: 'user' as const };
        setUser(userData);
        setIsAdmin(false);
        localStorage.setItem('auth_cache', JSON.stringify(userData));
        localStorage.setItem('is_admin_cache', 'false');

        toast.success('Account created successfully! Welcome aboard.');
      }

      navigate(isAdminMode ? '/admin' : '/dashboard');

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : error.message || 'Authentication failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Immediate State Push
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: 'user' as const
      };
      setUser(userData);
      setIsAdmin(false);

      // Manual Cache Push
      localStorage.setItem('auth_cache', JSON.stringify(userData));
      localStorage.setItem('is_admin_cache', 'false');

      toast.success('Authentication successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Google authentication failed.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start pt-32 pb-20 px-4 relative transition-colors duration-1000 ${isAdminMode ? 'bg-black' : 'bg-slate-950'} overflow-y-auto`}>
      {/* Dynamic Backgrounds */}
      <AnimatePresence mode="wait">
        {!isAdminMode ? (
          <motion.div
            key="user-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 w-full h-full opacity-25 pointer-events-none"
          >
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/30 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/30 rounded-full blur-[150px] animate-pulse delay-1000"></div>
          </motion.div>
        ) : (
          <motion.div
            key="admin-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 opacity-10 pointer-events-none"
          >
            <div className="grid grid-cols-6 gap-0 h-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-full border-r border-blue-500/20 w-px mx-auto"></div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        to="/"
        className="absolute top-8 left-4 md:left-8 flex items-center space-x-2 text-slate-400 hover:text-white transition-all bg-slate-900/50 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-800 z-50 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">Back to Portal</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className={`backdrop-blur-3xl p-8 md:p-10 rounded-[3rem] border transition-all duration-1000 ${isAdminMode ? 'bg-slate-950/90 border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.1)]' : 'bg-slate-900/40 border-slate-800/80 shadow-2xl'}`}>

          {/* Category Toggle */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mb-10 relative overflow-hidden">
            <motion.div
              layoutId="activeTab"
              className="absolute inset-y-1 bg-blue-600 rounded-xl"
              animate={{ x: isAdminMode ? '100%' : '0%' }}
              style={{ width: 'calc(50% - 4px)' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => { setIsAdminMode(false); setIsLogin(true); }}
              className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${!isAdminMode ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Passenger
            </button>
            <button
              onClick={() => { setIsAdminMode(true); setIsLogin(true); }}
              className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${isAdminMode ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Staff Access
            </button>
          </div>

          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div
              layout
              className={`p-5 rounded-[1.5rem] mb-6 shadow-xl transform rotate-12 ${isAdminMode ? 'bg-blue-600 shadow-blue-500/30' : 'bg-blue-600 shadow-blue-500/20'}`}
            >
              {isAdminMode ? <ShieldCheck className="w-8 h-8 text-white" /> : <Plane className="w-8 h-8 text-white transform -rotate-45" />}
            </motion.div>
            <h2 className={`text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2 ${isAdminMode ? 'font-mono' : ''}`}>
              {isAdminMode ? 'Terminal' : (isLogin ? 'Login' : 'Elite Club')}
            </h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">Bharat Ratan Airlines</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && !isAdminMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-7 py-4 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] text-white focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-slate-800 outline-none text-sm"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">{isAdminMode ? 'Administrative ID' : 'Account Email'}</label>
              <input
                type="email"
                className="w-full px-7 py-4 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] text-white focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-slate-800 outline-none text-sm"
                placeholder={isAdminMode ? "admin@airline.com" : "passenger@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">{isAdminMode ? 'Security Key' : 'Secret Key'}</label>
              <input
                type="password"
                className="w-full px-7 py-4 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] text-white focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-slate-800 outline-none text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full group text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3 uppercase tracking-[0.2em] text-[10px] mt-8 overflow-hidden relative ${isAdminMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <motion.div whileHover={{ x: 5 }} className="flex items-center space-x-3">
                    {isAdminMode ? <Lock className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    <span>{isAdminMode ? 'Open Terminal' : (isLogin ? 'Sign In Now' : 'Join the Club')}</span>
                  </motion.div>
                </>
              )}
            </button>
          </form>

          {!isAdminMode && (
            <>
              <div className="mt-8 mb-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.5em]">
                  <span className="px-6 bg-transparent text-slate-600 backdrop-blur-3xl">or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleAuth}
                className="w-full bg-white hover:bg-slate-100 text-slate-950 font-black py-4 rounded-[1.5rem] transition-all flex items-center justify-center space-x-3 uppercase tracking-widest text-[10px] shadow-xl active:scale-95 mb-6"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                <span>Google Authorization</span>
              </button>
            </>
          )}

          <div className="flex flex-col space-y-4 text-center mt-6">
            {!isAdminMode && (
              <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                {isLogin ? "New to Bharat Ratan? " : "Already an Elite Member? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-500 hover:text-blue-400 font-black ml-1 hover:underline"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            )}

            <p className={`text-[8px] font-black uppercase tracking-[0.3em] transition-colors ${isAdminMode ? 'text-blue-400' : 'text-slate-700'}`}>
              {isAdminMode ? 'Administrative Context Active • Level 4 Security' : 'Secure Passenger Gateway • SSL Encrypted'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


export default Auth;

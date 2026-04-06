import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { adminAuth } from '../lib/adminFirebase';
import { Plane, User, LogOut, Menu, X, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Clear both sessions just in case
      await Promise.all([
        signOut(auth),
        signOut(adminAuth)
      ]);
      navigate('/auth');
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'My Bookings', path: '/dashboard', show: !!user },
    { name: 'Admin Panel', path: '/admin', show: isAdmin },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
              <Plane className="h-6 w-6 text-white transform -rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter leading-none text-white">BHARAT RATAN</span>
              <span className="text-[10px] tracking-[0.2em] font-bold text-blue-400">AIRLINES</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.filter(link => link.show !== false).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    {isAdmin && <span className="text-[10px] text-blue-400 font-bold uppercase">Admin</span>}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-300 hover:text-white transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-slate-800 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.filter(link => link.show !== false).map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center space-x-3"
                >
                  {link.name === 'Admin Panel' ? <ShieldCheck className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
                  <span>{link.name}</span>
                </Link>
              ))}

              {user ? (
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <div className="flex items-center space-x-3 px-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.email}</p>
                      {isAdmin && <p className="text-xs text-blue-400 font-bold">Administrator</p>}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-500 hover:bg-red-500/10 transition-all flex items-center space-x-3"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;


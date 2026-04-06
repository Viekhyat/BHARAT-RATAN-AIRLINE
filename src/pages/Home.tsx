import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Calendar, MapPin, Plane, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: ''
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/search', { state: searchParams });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Preparing Cabin...</p>
      </div>
    );
  }

  // GUEST VIEW (LANDING)
  if (!user) {
    return (
      <div className="relative pt-32 min-h-screen flex flex-col items-center justify-start px-4 overflow-y-auto uppercase">
        {/* Background Decor */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full bg-slate-950/40 backdrop-blur-2xl rounded-[3rem] p-12 shadow-2xl border border-slate-800/50 text-center relative z-10"
        >
          <div className="flex justify-center mb-10">
            <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-6 rounded-3xl shadow-lg shadow-blue-500/20 transform -rotate-12">
              <Plane className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            BHARAT RATAN <span className="text-blue-500">AIRLINES</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed normal-case">
            Experience the pinnacle of Indian hospitality in the skies. Join the elite club for exclusive deals and seamless travel.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="group relative inline-flex items-center px-10 py-4 text-lg font-black text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/25 overflow-hidden"
            >
              <span className="relative z-10">Start Your Journey</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 pt-10 border-t border-slate-800/50">
            <Feature icon={<ShieldCheck className="text-blue-500" />} label="Safe & Secure" />
            <Feature icon={<Zap className="text-blue-500" />} label="Instant Booking" />
            <Feature icon={<Plane className="text-blue-500" />} label="Global Network" />
          </div>
        </motion.div>
      </div>
    );
  }

  // AUTHENTICATED VIEW (SEARCH)
  return (
    <div className="relative pt-32 min-h-screen flex flex-col items-center px-4">
      <div className="max-w-6xl w-full text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase"
        >
          WHERE TO <span className="text-blue-500">NEXT?</span>
        </motion.h1>
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">
          Welcome back, {user?.displayName || user?.email?.split('@')[0]} • Ready for your next adventure?
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-800/50"
      >
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          <div className="md:col-span-2 space-y-2 uppercase">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Origin</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="From where?"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-slate-600"
                value={searchParams.from}
                onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2 uppercase">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Destination</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Where to?"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-slate-600"
                value={searchParams.to}
                onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2 uppercase">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Departure</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="date"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-[60px] rounded-2xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-95 uppercase"
            >
              <Search className="h-5 w-5" />
              <span className="md:hidden lg:inline">Search</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* Trust Badges */}
      <div className="mt-20 flex flex-wrap justify-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-pointer">
        <span className="text-2xl font-black tracking-tighter">SKYTREE</span>
        <span className="text-2xl font-black tracking-tighter">GLOBAL</span>
        <span className="text-2xl font-black tracking-tighter">ASTRA</span>
        <span className="text-2xl font-black tracking-tighter">VAYU</span>
      </div>
    </div>
  );
};

const Feature = ({ icon, label }: any) => (
  <div className="flex flex-col items-center">
    <div className="mb-2 p-2 bg-slate-900 rounded-lg">{icon}</div>
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
  </div>
);

export default Home;

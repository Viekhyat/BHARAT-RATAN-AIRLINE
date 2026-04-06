import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Terminal, Activity, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const AdminLanding = () => {
    const { isAdmin, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && isAdmin) {
            navigate('/admin');
        }
    }, [isAdmin, loading, navigate]);

    if (loading) return null;

    return (
        <div className="relative pt-32 min-h-screen flex flex-col items-center justify-start px-4 overflow-y-auto bg-black">
            {/* Admin Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="grid grid-cols-8 gap-0 h-full border-l border-white/5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-full border-r border-white/5 w-px mx-auto"></div>
                    ))}
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full bg-slate-950/90 backdrop-blur-3xl rounded-[3rem] p-12 shadow-2xl border border-blue-500/20 text-center relative z-10"
            >
                <div className="flex justify-center mb-10">
                    <div className="bg-blue-600 p-6 rounded-3xl shadow-[0_0_30px_rgba(37,99,235,0.4)] transform rotate-12">
                        <Terminal className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none">
                    STAFF <span className="text-blue-500">TERMINAL</span>
                </h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mb-8">
                    Bharath Ratan Airlines • Flight Operations Command
                </p>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-10 text-left space-y-4">
                    <div className="flex items-start space-x-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Restricted Access Zone</h4>
                            <p className="text-slate-500 text-xs">This portal is reserved for authorized airline staff and executive administrators only.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link
                        to="/auth"
                        className="group relative inline-flex items-center px-12 py-5 text-lg font-black text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] overflow-hidden w-full md:w-auto"
                    >
                        <span className="relative z-10 flex items-center">
                            Authorize Access <Lock className="ml-3 w-5 h-5" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </Link>
                </div>

                <div className="mt-16 grid grid-cols-2 lg:grid-cols-3 gap-8 pt-10 border-t border-slate-800/50">
                    <AdminFeature icon={<Activity className="text-blue-500" />} label="Flight Tracking" />
                    <AdminFeature icon={<Globe className="text-blue-500" />} label="Global Network" />
                    <AdminFeature icon={<ShieldCheck className="text-blue-500" />} label="Security Ops" />
                </div>
            </motion.div>
        </div>
    );
};

const AdminFeature = ({ icon, label }: any) => (
    <div className="flex flex-col items-center">
        <div className="mb-2 p-2 bg-slate-900 rounded-lg">{icon}</div>
        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
    </div>
);

export default AdminLanding;

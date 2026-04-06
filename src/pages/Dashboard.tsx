import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Booking } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  MapPin,
  Clock,
  User as UserIcon,
  Shield,
  Search,
  CheckCircle2,
  Plane,
  TrendingUp,
  Award,
  CreditCard,
  Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'profile'>('upcoming');
  const [pnrSearch, setPnrSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            flight:flights(*, 
              origin:airports!origin_id(iata_code, city),
              destination:airports!destination_id(iata_code, city)
            ),
            seat:seats(*),
            passenger:passengers!inner(*)
          `)
          .eq('passenger.firebase_uid', user.uid);

        if (error) throw error;
        // @ts-ignore
        const mappedBookings: Booking[] = (data || []).map(b => ({
          id: b.id,
          userId: user.uid,
          flightId: b.flight_id,
          pnr: b.id.substring(0, 6).toUpperCase(),
          status: b.status as any,
          passengers: [{
            name: b.passenger?.full_name || 'Guest',
            seatNumber: b.seat?.seat_number || 'N/A'
          }],
          totalAmount: Number(b.total_paid),
          bookingDate: b.booking_date,
          flightDetails: {
            airline: 'Bharat Ratan Airlines',
            flightNumber: b.flight?.flight_number,
            from: b.flight?.origin?.iata_code,
            to: b.flight?.destination?.iata_code,
            date: b.flight?.departure_time,
            price: Number(b.flight?.base_price)
          } as any
        }));

        setBookings(mappedBookings);
      } catch (error) {
        console.error("Error fetching bookings from Supabase:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? A refund will be initiated.')) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled'
        })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled. Refund initiated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to cancel booking');
    }
  };

  const isPast = (date: string) => new Date(date) < new Date();

  const filteredBookings = bookings.filter(b => {
    const matchTab = activeTab === 'upcoming' ? !isPast(b.flightDetails.date) : isPast(b.flightDetails.date);
    if (activeTab === 'profile') return false;
    if (pnrSearch) return b.pnr.toLowerCase().includes(pnrSearch.toLowerCase());
    return matchTab;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-black">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Accessing Executive Deck...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 px-4 max-w-7xl mx-auto pb-20 overflow-x-hidden">
      {/* Premium Header Segment */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 relative"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-blue-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">
              <Award className="w-4 h-4" />
              <span>Elite Member • Bharat Ratan Club</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
              NAMASTE, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 uppercase">{user?.displayName || 'Traveler'}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Credit</p>
              <p className="text-xl font-black text-white">$4,250.00</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-500/20">
                {user?.displayName?.[0].toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-slate-950/40 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
            <nav className="space-y-2">
              <NavButton active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} icon={<Ticket className="w-5 h-5" />} label="Active Trips" count={bookings.filter(b => !isPast(b.flightDetails.date)).length} />
              <NavButton active={activeTab === 'past'} onClick={() => setActiveTab('past')} icon={<Calendar className="w-5 h-5" />} label="Trip Archives" />
              <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon className="w-5 h-5" />} label="Executive Profile" />
            </nav>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-4 opacity-80">Membership Tier</h4>
            <p className="text-3xl font-black mb-1 leading-none italic">PLATINUM</p>
            <p className="text-xs font-bold opacity-60">12,400 SkyPoints earned</p>
            <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest transition-all">
              Redeem Points
            </button>
          </div>

          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 flex items-start space-x-4">
            <div className="bg-blue-600/10 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Secure Travel</p>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold">Your transactions and personal identity are shielded by military-grade encryption.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-9 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black text-white uppercase tracking-tight">Executive Profile</h2>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ProfileCard label="Legal Identity" value={user?.displayName || 'Not Set'} icon={<UserIcon className="w-5 h-5" />} />
                  <ProfileCard label="Verified Email" value={user?.email || 'Not Set'} icon={<Shield className="w-5 h-5" />} />
                  <ProfileCard label="Account Status" value={isAdmin ? 'Executive Administrator' : 'Club Elite Member'} icon={<Award className="w-5 h-5" />} />
                  <ProfileCard label="Preferred Currency" value="USD ($)" icon={<CreditCard className="w-5 h-5" />} />
                </div>

                <div className="bg-slate-950/60 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                  <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center">
                    <Lock className="w-4 h-4 mr-3 text-blue-500" />
                    Security Infrastructure
                  </h3>
                  <div className="space-y-6">
                    <SecurityToggle label="Two-Factor Authentication" active={true} />
                    <SecurityToggle label="Biometric Access Sync" active={false} />
                    <SecurityToggle label="Transaction Alerts" active={true} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Search & Utility Bar */}
                <div className="bg-slate-900/60 backdrop-blur-2xl p-4 md:p-6 rounded-[2.5rem] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="TRACK BY PNR NUMBER (E.G. BR7X8Y)..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-xs font-black text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-black transition-all"
                      value={pnrSearch}
                      onChange={(e) => setPnrSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </button>
                    <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700">
                      <MapPin className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-40 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retrieving Data...</p>
                  </div>
                ) : filteredBookings.length > 0 ? (
                  <div className="space-y-8">
                    {filteredBookings.map((booking, index) => (
                      <BookingNode key={booking.id} booking={booking} index={index} onCancel={() => handleCancel(booking.id)} />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800"
                  >
                    <div className="bg-slate-800 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-700 shadow-xl">
                      <Plane className="w-10 h-10 text-slate-500 transform -rotate-45" />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">Sky-Logs are Empty</h3>
                    <p className="text-slate-500 mb-10 max-w-sm mx-auto font-bold">You haven't scheduled any journeys yet. Let's change that today.</p>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                      Book Your Next Flight
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const BookingNode = ({ booking, index, onCancel }: { booking: Booking, index: number, onCancel: () => void }) => {
  const isPast = new Date(booking.flightDetails.date) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-slate-800/80 hover:border-blue-500/50 transition-all overflow-hidden ${isPast ? 'grayscale-[0.8] opacity-80' : 'shadow-2xl'}`}
    >
      <div className="absolute top-0 right-0 p-8">
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Confirmation Port</p>
          <span className="text-xl font-mono font-black text-white tracking-widest bg-black/40 px-4 py-1 rounded-xl border border-white/5">
            {booking.pnr}
          </span>
        </div>
      </div>

      <div className="p-10">
        <div className="flex items-center space-x-4 mb-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
            <Plane className="w-6 h-6 text-white transform -rotate-45" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">{booking.flightDetails.airline}</h4>
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{booking.flightDetails.flightNumber}</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(booking.flightDetails.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-3 text-center md:text-left">
            <p className="text-5xl font-black text-white tracking-tighter leading-none mb-2">{booking.flightDetails.departureTime}</p>
            <p className="text-sm font-bold text-slate-400 truncate uppercase tracking-widest">{booking.flightDetails.from}</p>
          </div>

          <div className="md:col-span-6 px-10 relative py-4">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700 to-transparent -translate-y-1/2"></div>
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-y-1/2 z-10"
            >
              <Plane className="w-6 h-6 text-blue-500 rotate-90" />
            </motion.div>
            <div className="text-center">
              <div className="bg-slate-950 inline-block px-4 relative z-10">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">NON-STOP TRANSIT</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 text-center md:text-right">
            <p className="text-5xl font-black text-white tracking-tighter leading-none mb-2">{booking.flightDetails.arrivalTime}</p>
            <p className="text-sm font-bold text-slate-400 truncate uppercase tracking-widest">{booking.flightDetails.to}</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 pt-10 border-t border-slate-800/50">
          <div className="flex space-x-12">
            <div>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Primary Guest</p>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span className="text-lg font-black text-white uppercase tracking-tight">{booking.passengers[0].name}</span>
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Cabin Class</p>
              <p className="text-lg font-black text-white uppercase tracking-tight">{booking.passengers[0].seatNumber} • ECONOMY</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right mr-4">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Net Fare</p>
              <p className="text-3xl font-black text-blue-400 leading-none">${booking.totalAmount}</p>
            </div>
            <div className="flex flex-col space-y-2">
              {!isPast && booking.status === 'confirmed' && (
                <button
                  onClick={onCancel}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-xl border border-red-500/20 transition-all"
                >
                  Ground Booking
                </button>
              )}
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                Boarding Pass
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overlays */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: booking.status === 'confirmed' ? '100%' : '0%' }}
          className={`h-full ${booking.status === 'confirmed' ? 'bg-green-500' : 'bg-red-500'}`}
        />
      </div>
    </motion.div>
  );
};

const NavButton = ({ active, onClick, icon, label, count }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-5 rounded-[1.8rem] transition-all relative group overflow-hidden ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25' : 'text-slate-500 hover:text-white'
      }`}
  >
    <div className="flex items-center space-x-4 relative z-10 font-black uppercase tracking-widest text-[10px]">
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/20' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
        {icon}
      </div>
      <span>{label}</span>
    </div>
    {count !== undefined && (
      <span className={`relative z-10 px-3 py-1 rounded-lg text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>
        {count}
      </span>
    )}
    {!active && <div className="absolute inset-0 bg-slate-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
  </button>
);

const ProfileCard = ({ label, value, icon }: any) => (
  <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-800/80 hover:border-blue-500/30 transition-all group">
    <div className="flex items-center space-x-4 mb-4">
      <div className="p-3 bg-blue-600/10 rounded-xl group-hover:bg-blue-600 transition-colors">
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-xl font-black text-white uppercase tracking-tight">{value}</p>
  </div>
);

const SecurityToggle = ({ label, active }: { label: string, active: boolean }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-bold text-slate-400">{label}</span>
    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${active ? 'bg-blue-600' : 'bg-slate-800'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
  </div>
);

const Lock = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5L15 8" /><path d="M9 22v-4a4.8 4.8 0 0 1 1-3.5L9 8" /><path d="M18 8a6 6 0 0 0-12 0" /><rect width="20" height="12" x="2" y="8" rx="2" /></svg>
);

export default Dashboard;

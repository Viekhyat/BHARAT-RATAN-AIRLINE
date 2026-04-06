import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    updateDoc,
    doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
    Plus,
    Trash2,
    Plane,
    Users,
    BarChart3,
    Clock,
    XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Flight, Booking } from '../types';
import { motion } from 'framer-motion';

const Admin = () => {
    const { isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [flights, setFlights] = useState<Flight[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'analytics' | 'flights' | 'bookings' | 'users'>('analytics');

    // New Flight Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newFlight, setNewFlight] = useState<Partial<Flight>>({
        airline: 'Bharat Ratan Airlines',
        status: 'active',
        totalSeats: 60
    });

    useEffect(() => {
        if (!isAdmin) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Flights
                console.log("Fetching flights...");
                const { data: flightsData, error: flightsError } = await supabase
                    .from('flights')
                    .select(`
                        *,
                        origin:airports!origin_id(iata_code, city),
                        destination:airports!destination_id(iata_code, city)
                    `)
                    .order('departure_time', { ascending: false });

                if (flightsError) {
                    console.error("Flights Error:", flightsError);
                    throw new Error(`Flights: ${flightsError.message}`);
                }

                // @ts-ignore
                const mappedFlights: Flight[] = (flightsData || []).map(f => ({
                    id: f.id,
                    flightNumber: f.flight_number,
                    from: f.origin?.iata_code || 'Unknown',
                    to: f.destination?.iata_code || 'Unknown',
                    date: new Date(f.departure_time).toISOString().split('T')[0],
                    departureTime: new Date(f.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    arrivalTime: new Date(f.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    price: Number(f.base_price),
                    airline: 'Bharat Ratan Airlines',
                    status: f.status as any,
                    totalSeats: 60,
                }));
                setFlights(mappedFlights);

                // 2. Fetch Bookings
                console.log("Fetching bookings...");
                const { data: bookingsData, error: bookingsError } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        passenger:passengers(*),
                        flight:flights(*, 
                            origin:airports!origin_id(iata_code),
                            destination:airports!destination_id(iata_code)
                        ),
                        seat:seats(*)
                    `);

                if (bookingsError) {
                    console.error("Bookings Error:", bookingsError);
                    // We don't throw yet, maybe we can still show flights
                    toast.error(`Bookings Load Error: ${bookingsError.message}`);
                } else {
                    // @ts-ignore
                    const mappedBookings: Booking[] = (bookingsData || []).map(b => ({
                        id: b.id,
                        userId: b.passenger?.firebase_uid,
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
                }

                // 3. Fetch Users
                console.log("Fetching passengers...");
                const { data: passengersData, error: passengersError } = await supabase
                    .from('passengers')
                    .select('*');

                if (passengersError) {
                    console.error("Passengers Error:", passengersError);
                } else {
                    setUsers(passengersData || []);
                }

            } catch (error: any) {
                console.error("Critical Admin Sync failure:", error);
                toast.error(`Sync Failed: ${error.message || 'Unknown protocol error'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAdmin]);

    const handleAddFlight = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Helper to get or create airport
            const getAirportId = async (iata: string) => {
                const { data } = await supabase
                    .from('airports')
                    .select('id')
                    .eq('iata_code', iata.toUpperCase())
                    .single();

                if (data) return data.id;

                const { data: newData, error: newError } = await supabase
                    .from('airports')
                    .insert([{ iata_code: iata.toUpperCase(), name: iata.toUpperCase(), city: iata, country: 'India' }])
                    .select()
                    .single();

                if (newError) throw newError;
                return newData.id;
            };

            const originId = await getAirportId(newFlight.from as string);
            const destinationId = await getAirportId(newFlight.to as string);

            // Construct times - your UI uses string dates, Supabase needs ISO
            const departureDateTime = `${newFlight.date}T${newFlight.departureTime}:00Z`;
            const arrivalDateTime = `${newFlight.date}T${newFlight.arrivalTime}:00Z`;

            const { error: flightError } = await supabase
                .from('flights')
                .insert([{
                    flight_number: newFlight.flightNumber,
                    origin_id: originId,
                    destination_id: destinationId,
                    departure_time: departureDateTime,
                    arrival_time: arrivalDateTime,
                    base_price: newFlight.price,
                    status: 'scheduled'
                }]);

            if (flightError) throw flightError;

            // Trigger refresh
            window.location.reload();
            setShowAddModal(false);
            toast.success("Flight published to Supabase");
        } catch (error) {
            console.error(error);
            toast.error("Failed to add flight to Supabase");
        }
    };

    const handleUpdateStatus = async (flightId: string, status: Flight['status']) => {
        try {
            const { error } = await supabase
                .from('flights')
                .update({ status })
                .eq('id', flightId);

            if (error) throw error;
            setFlights(flights.map(f => f.id === flightId ? { ...f, status } : f));
            toast.success(`Flight marked as ${status}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleToggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            // Your users seem to be in Firestore, keeping this as is for now 
            // OR if they are in supabase 'passengers' table:
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
            toast.success(`User role updated to ${newRole}`);
        } catch (error) {
            toast.error("Failed to update user role");
        }
    };

    const handleDeleteFlight = async (flightId: string) => {
        if (!confirm("Are you sure? This will delete the flight permanentely.")) return;
        try {
            const { error } = await supabase
                .from('flights')
                .delete()
                .eq('id', flightId);

            if (error) throw error;
            setFlights(flights.filter(f => f.id !== flightId));
            toast.success("Flight deleted from Supabase");
        } catch (error) {
            toast.error("Failed to delete flight");
        }
    };

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            navigate('/admin-portal');
        }
    }, [isAdmin, authLoading, navigate]);

    if (authLoading || (isAdmin && loading)) {
        return (
            <div className="pt-32 min-h-screen flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Accessing Control Tower...</p>
            </div>
        );
    }

    if (!isAdmin) return null;

    const stats = {
        totalRevenue: bookings.reduce((acc, curr) => acc + curr.totalAmount, 0),
        totalBookings: bookings.length,
        activeFlights: flights.filter(f => f.status === 'active').length,
        cancelledFlights: flights.filter(f => f.status === 'cancelled').length
    };

    return (
        <div className="pt-32 px-4 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">ADMIN CONTROL</h1>
                    <p className="text-slate-400">Manage flights, bookings and analytics across Bharat Ratan Airlines</p>
                </div>
                <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('flights')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'flights' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Flights
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Bookings
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Users
                    </button>
                </div>
            </div>

            {activeTab === 'analytics' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">System Analytics</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Real-time performance monitoring</p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => toast.success('Traffic Report Generated Successfully')}
                                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all border border-slate-700"
                            >
                                Traffic Report
                            </button>
                            <button
                                onClick={() => toast.success('Financial Report Shared to Admin Email')}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                            >
                                Financial Export
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Total Revenue"
                            value={`$${stats.totalRevenue.toLocaleString()}`}
                            icon={<BarChart3 className="text-blue-500" />}
                            trend="+12.5% from last month"
                            color="blue"
                        />
                        <StatCard
                            label="Total Bookings"
                            value={stats.totalBookings.toString()}
                            icon={<Users className="text-blue-500" />}
                            trend="+24 new today"
                            color="purple"
                        />
                        <StatCard
                            label="Active Flights"
                            value={stats.activeFlights.toString()}
                            icon={<Plane className="text-blue-500" />}
                            trend="98% on-time rate"
                            color="green"
                        />
                        <StatCard
                            label="Cancellations"
                            value={stats.cancelledFlights.toString()}
                            icon={<XCircle className="text-red-500" />}
                            trend="-5% from last week"
                            color="red"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800">
                            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-6">Booking Analytics</h3>
                            <div className="h-64 flex items-end justify-between px-4 pb-4 border-b border-slate-800 space-x-2">
                                {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        className="w-full bg-blue-600/20 hover:bg-blue-600 transition-all rounded-t-lg relative group"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {h * 12}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 px-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800">
                            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-6">Route Distribution</h3>
                            <div className="space-y-6">
                                <RouteProgress label="BOM ➔ DXB" value={85} />
                                <RouteProgress label="DEL ➔ LHR" value={65} />
                                <RouteProgress label="BLR ➔ SIN" value={45} />
                                <RouteProgress label="CCU ➔ BKK" value={30} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'flights' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Flight Management</h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Add New Flight</span>
                        </button>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4">Flight</th>
                                    <th className="px-6 py-4">Route</th>
                                    <th className="px-6 py-4">Schedule</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {flights.map(flight => (
                                    <tr key={flight.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{flight.airline}</div>
                                            <div className="text-xs text-slate-500">{flight.flightNumber}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-white font-medium">{flight.from} ➔ {flight.to}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-white">{flight.date}</div>
                                            <div className="text-xs text-slate-500">{flight.departureTime} - {flight.arrivalTime}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${flight.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                                flight.status === 'delayed' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                {flight.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white font-bold">${flight.price}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(flight.id, 'delayed')}
                                                    className="p-1.5 hover:bg-yellow-500/10 text-yellow-500 rounded-md transition-all"
                                                    title="Mark Delayed"
                                                >
                                                    <Clock className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(flight.id, 'cancelled')}
                                                    className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-md transition-all"
                                                    title="Cancel Flight"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFlight(flight.id)}
                                                    className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-md transition-all"
                                                    title="Delete Flight"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'bookings' && (activeTab === 'bookings' && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Recent Bookings</h2>
                    <div className="space-y-4">
                        {bookings.map(booking => (
                            <div key={booking.id} className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center space-x-3 mb-1">
                                        <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase">{booking.pnr}</span>
                                        <span className="text-sm text-slate-400">{new Date(booking.bookingDate).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">
                                        {booking.passengers[0].name} <span className="text-sm font-normal text-slate-400">booked</span> {booking.flightDetails.airline} ({booking.flightDetails.flightNumber})
                                    </h3>
                                    <p className="text-slate-400 text-sm">
                                        Route: {booking.flightDetails.from} ➔ {booking.flightDetails.to} | Seats: {booking.passengers[0].seatNumber}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-blue-400">${booking.totalAmount}</div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                                        'bg-red-500/10 text-red-500'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {activeTab === 'users' && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">User & Staff Management</h2>
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4">Identity</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Access Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {users.map(u => (
                                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                                    <Users className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <span className="font-bold text-white">{u.displayName || 'Anonymous User'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                {u.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleRole(u.uid, u.role || 'user')}
                                                className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500/10"
                                            >
                                                {u.role === 'admin' ? 'Revoke Staff Access' : 'Grant Staff Access'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Flight Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
                    >
                        <h2 className="text-3xl font-black text-white mb-6">Add New Flight</h2>
                        <form onSubmit={handleAddFlight} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Airline</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newFlight.airline}
                                    onChange={e => setNewFlight({ ...newFlight, airline: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Flight Number</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="BR123"
                                    onChange={e => setNewFlight({ ...newFlight, flightNumber: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">From</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="City/Code"
                                    onChange={e => setNewFlight({ ...newFlight, from: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">To</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="City/Code"
                                    onChange={e => setNewFlight({ ...newFlight, to: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    onChange={e => setNewFlight({ ...newFlight, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Price ($)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    onChange={e => setNewFlight({ ...newFlight, price: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Departure</label>
                                <input
                                    type="time"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    onChange={e => setNewFlight({ ...newFlight, departureTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Arrival</label>
                                <input
                                    type="time"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    onChange={e => setNewFlight({ ...newFlight, arrivalTime: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Publish Flight
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, color, trend }: { icon: React.ReactNode, label: string, value: string, color: string, trend?: string }) => (
    <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800 flex items-center space-x-4">
        <div className={`p-4 rounded-2xl bg-${color}-500/10`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
            {trend && <p className="text-[10px] font-bold text-green-500 mt-1 uppercase tracking-tight">{trend}</p>}
        </div>
    </div>
);

const RouteProgress = ({ label, value }: { label: string, value: number }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-white">{label}</span>
            <span className="text-slate-500">{value}% LOAD</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                className="bg-blue-600 h-full rounded-full"
            />
        </div>
    </div>
);

export default Admin;

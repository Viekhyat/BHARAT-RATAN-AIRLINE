import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Flight } from '../types';
import { toast } from 'react-hot-toast';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  CreditCard,
  ShieldCheck,
  Armchair,
  Ticket
} from 'lucide-react';
import clsx from 'clsx';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const ROWS = 10;
const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const flight = location.state as Flight;
  const [step, setStep] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passenger, setPassenger] = useState({
    name: '',
    age: '',
    gender: 'Male'
  });

  if (!flight) {
    return (
      <div className="pt-32 text-center text-white">
        <h2 className="text-2xl font-black mb-4 uppercase">Flight data missing</h2>
        <button onClick={() => navigate('/')} className="bg-blue-600 px-6 py-2 rounded-xl">Back to Home</button>
      </div>
    );
  }

  const toggleSeat = (seat: string) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleBooking = async () => {
    try {
      if (!auth.currentUser) {
        toast.error("Please login to book a flight");
        return;
      }

      // 1. Upsert Passenger linked to Firebase UID
      const { data: pData, error: pError } = await supabase
        .from('passengers')
        .upsert({
          firebase_uid: auth.currentUser.uid,
          full_name: passenger.name,
          email: auth.currentUser.email || `${auth.currentUser.uid}@temporary.com`
        }, { onConflict: 'firebase_uid' })
        .select()
        .single();

      if (pError) throw pError;

      // 2. Register/Update Seats status
      const { data: sData, error: sError } = await supabase
        .from('seats')
        .upsert(selectedSeats.map(s => ({
          flight_id: flight.id,
          seat_number: s,
          is_available: false,
          class: 'Economy' // Default
        })), { onConflict: 'flight_id,seat_number' })
        .select();

      if (sError) throw sError;

      // 3. Create Booking records
      const { error: bError } = await supabase
        .from('bookings')
        // @ts-ignore
        .insert(sData.map(s => ({
          passenger_id: pData.id,
          flight_id: flight.id,
          seat_id: s.id,
          total_paid: flight.price,
          status: 'confirmed'
        })));

      if (bError) throw bError;

      toast.success(`Booking Confirmed!`);
      setStep(4);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      console.error("Supabase Booking Error: ", error);
      toast.error("Booking failed. Please check your database connection.");
    }
  };

  const renderSeats = () => {
    const seats = [];
    for (let i = 1; i <= ROWS; i++) {
      const rowSeats: React.ReactNode[] = [];
      COLS.forEach(col => {
        const seatId = `${i}${col}`;
        const isSelected = selectedSeats.includes(seatId);
        const isOccupied = !isSelected && (seatId.charCodeAt(0) + seatId.charCodeAt(1)) % 7 === 0;

        rowSeats.push(
          <button
            key={seatId}
            disabled={isOccupied}
            onClick={() => toggleSeat(seatId)}
            className={clsx(
              "relative w-8 h-8 md:w-10 md:h-10 m-1 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
              isSelected ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40 scale-110 z-10" :
                isOccupied ? "bg-slate-800 text-slate-700 cursor-not-allowed opacity-50" :
                  "bg-slate-200 text-slate-900 hover:bg-white hover:scale-105"
            )}
          >
            <Armchair className={clsx("w-4 h-4 md:w-5 md:h-5", isSelected ? "text-white" : isOccupied ? "text-slate-700" : "text-slate-400")} />
            <span className="absolute -bottom-4 text-[8px] text-slate-500 hidden md:block">{seatId}</span>
          </button>
        );
        if (col === 'C') {
          rowSeats.push(<div key={`aisle-${i}`} className="w-4 md:w-8"></div>);
        }
      });
      seats.push(
        <div key={i} className="flex justify-center items-center mb-6">
          <span className="w-6 text-[10px] font-black text-slate-600 mr-2">{i}</span>
          {rowSeats}
        </div>
      );
    }
    return seats;
  };

  return (
    <div className="pt-28 px-4 max-w-7xl mx-auto pb-20">
      {/* Stepper */}
      <div className="flex justify-center mb-12">
        <div className="flex items-center space-x-4 md:space-x-8">
          <StepIndicator active={step >= 1} current={step === 1} label="Seats" icon={<Armchair className="w-4 h-4" />} />
          <div className={`w-8 md:w-16 h-[2px] ${step > 1 ? 'bg-blue-600' : 'bg-slate-800'}`}></div>
          <StepIndicator active={step >= 2} current={step === 2} label="Details" icon={<User className="w-4 h-4" />} />
          <div className={`w-8 md:w-16 h-[2px] ${step > 2 ? 'bg-blue-600' : 'bg-slate-800'}`}></div>
          <StepIndicator active={step >= 3} current={step === 3} label="Payment" icon={<CreditCard className="w-4 h-4" />} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-950/50 backdrop-blur-md p-6 md:p-10 rounded-[2.5rem] border border-slate-800"
              >
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Select your seat</h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Flight {flight.flightNumber} • {flight.from} to {flight.to}</p>
                  </div>
                  <div className="flex space-x-6 text-[10px] font-black uppercase tracking-widest">
                    <Legend color="bg-slate-200" label="Free" />
                    <Legend color="bg-slate-800" label="Sold" />
                    <Legend color="bg-blue-500" label="Pick" />
                  </div>
                </div>

                <div className="relative max-w-md mx-auto bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800/50">
                  <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-blue-600/10 to-transparent rounded-t-[3rem]"></div>
                  <div className="relative pt-10 pb-4">
                    {renderSeats()}
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-800 flex justify-center uppercase font-black text-[10px] text-slate-500 tracking-[0.5em]">
                    EXIT ROWS
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-950/50 backdrop-blur-md p-10 rounded-[2.5rem] border border-slate-800"
              >
                <h2 className="text-3xl font-black text-white uppercase mb-8">Passenger Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name (as per Passport)</label>
                    <input
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      placeholder="John Doe"
                      value={passenger.name}
                      onChange={e => setPassenger({ ...passenger, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Age</label>
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      placeholder="25"
                      value={passenger.age}
                      onChange={e => setPassenger({ ...passenger, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none"
                      value={passenger.gender}
                      onChange={e => setPassenger({ ...passenger, gender: e.target.value })}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-950/50 backdrop-blur-md p-10 rounded-[2.5rem] border border-slate-800"
              >
                <div className="flex justify-between items-start mb-8 text-white uppercase font-black">
                  <h2 className="text-3xl tracking-tight">Payment Method</h2>
                  <div className="flex items-center space-x-2 text-green-500 text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>SSL SECURED</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700/50 mb-8 max-w-sm">
                  <div className="flex justify-between mb-12">
                    <div className="w-12 h-8 bg-yellow-500/20 rounded-md border border-yellow-500/50"></div>
                    <Ticket className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="text-2xl font-mono text-white tracking-[0.2em] mb-4">•••• •••• •••• 4242</div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase font-black">Exp</p>
                      <p className="text-xs text-white font-mono">12/28</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-500 uppercase font-black">Holder</p>
                      <p className="text-xs text-white uppercase font-black">{passenger.name || 'Your Name'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-900 border-2 border-blue-600 rounded-3xl flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <CreditCard className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Credit Card</p>
                      <p className="text-xs text-slate-500">**** **** **** 4242</p>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center space-x-4 opacity-40">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black italic">
                      UPI
                    </div>
                    <div>
                      <p className="font-bold text-white">Google Pay / UPI</p>
                      <p className="text-xs text-slate-500">Pay using app</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-950/50 backdrop-blur-md p-10 rounded-[2.5rem] border border-slate-800 text-center py-20"
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/40">
                  <Check className="w-12 h-12 text-white stroke-[4]" />
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4">Confirmed!</h2>
                <p className="text-slate-400 font-bold mb-10 max-w-sm mx-auto">Your flight with Bharat Ratan Airlines is booked. You will be redirected to your dashboard in a few seconds.</p>
                <div className="flex justify-center space-x-4">
                  <div className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-white uppercase tracking-widest">
                    Printing Ticket...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary Sidebar */}
        {step < 4 && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-950/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800">
              <h3 className="text-xl font-black text-white uppercase mb-6 tracking-tight">Order Summary</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fare</span>
                  <span className="text-white font-black">${flight.price} x {selectedSeats.length || 1}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Tax & Service</span>
                  <span className="text-white font-black">$45.00</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-white font-black uppercase text-xs">Total Amount</span>
                  <span className="text-3xl font-black text-blue-500">${(flight.price * (selectedSeats.length || 1)) + 45}</span>
                </div>
              </div>

              <div className="space-y-4">
                {step === 1 && (
                  <button
                    disabled={selectedSeats.length === 0}
                    onClick={() => setStep(2)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center"
                  >
                    Next Step <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                )}
                {step === 2 && (
                  <button
                    disabled={!passenger.name || !passenger.age}
                    onClick={() => setStep(3)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center"
                  >
                    Continue to Payment <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                )}
                {step === 3 && (
                  <button
                    onClick={handleBooking}
                    className="w-full bg-green-600 hover:bg-green-700 font-black py-4 rounded-2xl transition-all shadow-xl shadow-green-500/20 active:scale-95 flex items-center justify-center"
                  >
                    Complete Payment <Check className="ml-2 w-5 h-5" />
                  </button>
                )}
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="w-full text-slate-500 hover:text-white font-black py-2 transition-all flex items-center justify-center text-xs uppercase"
                  >
                    <ChevronLeft className="mr-2 w-4 h-4" /> Go Back
                  </button>
                )}
              </div>
            </div>

            <div className="bg-blue-600/10 p-6 rounded-2xl border border-blue-500/20">
              <div className="flex items-center space-x-3 text-blue-400 mb-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-extrabold uppercase text-xs tracking-widest">Travel Guarantee</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Free cancellation up to 24h before departure. 24/7 priority support for premium flyers.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StepIndicator = ({ active, current, label, icon }: any) => (
  <div className="flex flex-col items-center group">
    <div className={clsx(
      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2",
      current ? "bg-blue-600 border-blue-600 scale-125 z-10 shadow-lg shadow-blue-500/40" :
        active ? "bg-slate-900 border-blue-600 text-blue-500" :
          "bg-slate-950 border-slate-800 text-slate-700"
    )}>
      {icon}
    </div>
    <span className={clsx(
      "mt-3 text-[10px] font-black uppercase tracking-widest",
      current ? "text-white" : active ? "text-blue-500" : "text-slate-700"
    )}>
      {label}
    </span>
  </div>
);

const Legend = ({ color, label }: any) => (
  <div className="flex items-center space-x-2">
    <div className={`w-3 h-3 rounded-sm ${color}`}></div>
    <span className="text-slate-500">{label}</span>
  </div>
);

export default BookingPage;


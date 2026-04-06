import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Flight } from '../types';
import { supabase } from '../lib/supabase';
import {
  Plane,
  Clock,
  ChevronRight,
  MapPin,
  Search,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

const SearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = location.state as { from: string; to: string; date: string } | null;

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      try {
        let q = supabase
          .from('flights')
          .select(`
            *,
            origin:airports!origin_id(iata_code, city),
            destination:airports!destination_id(iata_code, city)
          `);

        if (searchParams) {
          // Join filtering is a bit complex in Supabase, we filter on the joined table's codes
          q = q
            .eq('origin.iata_code', searchParams.from.toUpperCase())
            .eq('destination.iata_code', searchParams.to.toUpperCase())
            .gte('departure_time', `${searchParams.date}T00:00:00Z`)
            .lte('departure_time', `${searchParams.date}T23:59:59Z`);
        }

        const { data, error } = await q;
        if (error) throw error;
        // @ts-ignore
        const mappedFlights: Flight[] = (data || []).map(f => ({
          id: f.id,
          flightNumber: f.flight_number,
          from: f.origin?.iata_code,
          to: f.destination?.iata_code,
          date: new Date(f.departure_time).toISOString().split('T')[0],
          departureTime: new Date(f.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          arrivalTime: new Date(f.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: Number(f.base_price),
          airline: 'Bharat Ratan Airlines',
          status: f.status as any,
          totalSeats: 60
        }));

        setFlights(mappedFlights);
      } catch (error) {
        console.error("Error fetching flights from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchParams]);

  return (
    <div className="pt-28 px-4 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Search Results</h1>
            <p className="text-sm text-slate-500 font-bold">
              {searchParams?.from} ➔ {searchParams?.to} • {searchParams?.date}
            </p>
          </div>
        </div>

        <div className="flex bg-slate-900 rounded-2xl p-1 border border-slate-800">
          <div className="px-6 py-2.5 text-xs font-black text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            Cheapest
          </div>
          <div className="px-6 py-2.5 text-xs font-black text-slate-500 hover:text-white transition-colors cursor-pointer">
            Fastest
          </div>
          <div className="px-6 py-2.5 text-xs font-black text-slate-500 border-l border-slate-800 flex items-center cursor-pointer">
            <Filter className="w-3 h-3 mr-2" /> Filters
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-xs">Finding best fares...</p>
        </div>
      ) : flights.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {flights.map((flight, index) => (
            <motion.div
              key={flight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 hover:border-blue-500/30 transition-all group overflow-hidden relative"
            >
              {/* Decorative side bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="flex items-center space-x-6 w-full lg:w-auto">
                  <div className="w-16 h-16 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                    <Plane className="w-8 h-8 text-blue-600 transform -rotate-45" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{flight.airline}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded uppercase">{flight.flightNumber}</span>
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> ON TIME
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full grid grid-cols-3 items-center">
                  <div className="text-center md:text-left">
                    <p className="text-3xl font-black text-white">{flight.departureTime}</p>
                    <p className="text-sm font-bold text-slate-500 flex items-center justify-center md:justify-start">
                      <MapPin className="w-3 h-3 mr-1" /> {flight.from}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center px-4">
                    <div className="text-[10px] font-black text-slate-600 mb-2 uppercase tracking-widest">2h 45m</div>
                    <div className="w-full max-w-[120px] h-[2px] bg-slate-800 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                    </div>
                    <div className="text-[10px] font-bold text-blue-500 mt-2 uppercase">NON-STOP</div>
                  </div>

                  <div className="text-center md:text-right">
                    <p className="text-3xl font-black text-white">{flight.arrivalTime}</p>
                    <p className="text-sm font-bold text-slate-500 flex items-center justify-center md:justify-end">
                      <MapPin className="w-3 h-3 mr-1" /> {flight.to}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto lg:pl-10 lg:border-l lg:border-slate-800">
                  <div className="text-left lg:text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Starting from</div>
                    <div className="text-4xl font-black text-white leading-tight">${flight.price}</div>
                  </div>
                  <button
                    onClick={() => navigate('/booking', { state: flight })}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center"
                  >
                    Select <ChevronRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
          <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">No Flights Found</h2>
          <p className="text-slate-500 font-bold max-w-sm mx-auto mb-8">We couldn't find any flights for this route. Try changing your search criteria.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white text-slate-950 font-black px-10 py-4 rounded-full transition-all hover:bg-slate-200"
          >
            Refine Search
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;


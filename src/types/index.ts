export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: 'user' | 'admin';
}

export interface Flight {
  id: string;
  from: string;
  to: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  airline: string;
  flightNumber: string;
  status: 'active' | 'delayed' | 'cancelled';
  totalSeats: number;
  availableSeats?: string[];
}

export interface Booking {
  id: string;
  userId: string;
  flightId: string;
  pnr: string;
  status: 'confirmed' | 'cancelled' | 'refunded';
  passengers: Passenger[];
  totalAmount: number;
  bookingDate: string;
  flightDetails: Flight;
  refundStatus?: 'pending' | 'processed';
}

export interface Passenger {
  name: string;
  age?: number;
  gender?: string;
  seatNumber: string;
}


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ThreeBackground from './components/ThreeBackground';
import Home from './pages/Home';
import Auth from './pages/Auth';
import SearchResults from './pages/SearchResults';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import Admin from './pages/Admin';
import AdminLanding from './pages/AdminLanding';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen text-slate-200 font-sans bg-slate-900">
          <ThreeBackground />
          <Navbar />
          <Toaster position="top-right" />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-portal" element={<AdminLanding />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

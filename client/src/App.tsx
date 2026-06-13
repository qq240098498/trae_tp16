import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ProductDetail from "@/pages/ProductDetail";
import Publish from "@/pages/Publish";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Profile from "@/pages/Profile";
import Favorites from "@/pages/Favorites";
import ReturnDetail from "@/pages/ReturnDetail";
import Navbar from "@/components/Navbar";
import { ToastContainer } from "@/components/UI";
import { useAuthStore } from "@/store/useAuthStore";

function AppContent() {
  const location = useLocation();
  const fetchProfile = useAuthStore(s => s.fetchProfile);
  const token = useAuthStore(s => s.token);
  const showNavbar = !['/login'].includes(location.pathname);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/returns/:id" element={<ReturnDetail />} />
        <Route path="*" element={<div className="text-center py-20 text-gray-400">页面不存在</div>} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

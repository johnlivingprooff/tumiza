import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import TrackingPage from "./pages/TrackingPage";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ParcelRegistration from "./pages/ParcelRegistration";
import ParcelDetail from "./pages/ParcelDetail";
import QRScanner from "./pages/QRScanner";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/track" element={<TrackingPage />} />
      <Route path="/track/:trackingNumber" element={<TrackingPage />} />
      <Route path="/dashboard" element={<OfficerDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/parcels/register" element={<ParcelRegistration />} />
      <Route path="/parcels/:id" element={<ParcelDetail />} />
      <Route path="/parcels/scan" element={<QRScanner />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

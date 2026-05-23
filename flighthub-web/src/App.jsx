import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider.jsx";
import { Toaster } from "./components/ui/sonner.jsx";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";

import LandingPage from "./pages/Landing/LandingPage.jsx";
import Header from "./pages/traveler/Home/Header.jsx";
import HomePage from "./pages/traveler/Home/HomePage.jsx";
import SearchResults from "./pages/traveler/FlightList/SearchResults.jsx";
import PaymentPage from "./pages/traveler/Payment/PaymentPage.jsx";
import BookingHistory from "./pages/traveler/BookingHistory/BookingHistory.jsx";
import BookingSuccess from "./pages/traveler/BookingSuccess/BookingSuccess.jsx";
import ETicket from "./pages/traveler/Ticket/ETicket.jsx";
import Ticket from "./pages/traveler/Ticket/Ticket.jsx";
import UserProfile from "./pages/traveler/Profile/UserProfile.jsx";

import AirlineDashboard from "./pages/airline/Dashboard/AirlineDashboard.jsx";
import SuperAdminDashboard from "./pages/super-admin/Dashboard/SuperAdminDashboard.jsx";

import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import Auth from "./pages/auth/Auth.jsx";

import BookingReview from "./pages/traveler/BookingReview/BookingReview.jsx";
import AirlineOnboardingWizard from "./pages/Onboarding/AirlineOnboardingWizard";

import { getUserProfile } from "./Redux/user/userThunks.js";

import AuthRequired from "./components/auth/AuthRequired.jsx";
import GuestOnly from "./components/auth/GuestOnly.jsx";

// ============================
// ROLE REDIRECT
// ============================
function RoleRedirect() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      dispatch(getUserProfile());
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || loading || !user?.role) return;

    switch (user.role) {
      case "ROLE_SYSTEM_ADMIN":
        navigate("/super-admin");
        break;
      case "ROLE_AIRLINE_OWNER":
        navigate("/airline");
        break;
      default:
        navigate("/traveler");
    }
  }, [isAuthenticated, user, loading, navigate]);

  return null;
}

// ============================
// APP
// ============================
function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background transition-colors">
          <Toaster />

          <Routes>
            {/* ================= AUTH ================= */}
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <Auth isLogin={true} />
                </GuestOnly>
              }
            />

            <Route
              path="/register"
              element={
                <GuestOnly>
                  <Auth isLogin={false} />
                </GuestOnly>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <GuestOnly>
                  <ForgotPassword />
                </GuestOnly>
              }
            />

            <Route
              path="/reset-password/:token"
              element={
                <GuestOnly>
                  <ResetPassword />
                </GuestOnly>
              }
            />

            {/* ================= LANDING ================= */}
            <Route
              path="/"
              element={
                <>
                  <RoleRedirect />
                  <LandingPage />
                </>
              }
            />

            {/* ================= ONBOARDING ================= */}
            <Route
              path="/airline-onboarding"
              element={<AirlineOnboardingWizard />}
            />

            {/* ================= TRAVELER ================= */}
            <Route
              path="/traveler"
              element={
                <>
                  <Header />
                  <HomePage />
                </>
              }
            />

            <Route
              path="/search"
              element={
                <>
                  <Header />
                  <SearchResults />
                </>
              }
            />

            <Route
              path="/booking-review"
              element={
                <AuthRequired>
                  <Header />
                  <BookingReview />
                </AuthRequired>
              }
            />

            <Route
              path="/payment"
              element={
                <AuthRequired>
                  <Header />
                  <PaymentPage />
                </AuthRequired>
              }
            />

            <Route
              path="/bookings"
              element={
                <AuthRequired>
                  <Header />
                  <BookingHistory />
                </AuthRequired>
              }
            />

            <Route
              path="/profile"
              element={
                <AuthRequired>
                  <Header />
                  <UserProfile />
                </AuthRequired>
              }
            />

            <Route
              path="/booking-success/:bookingId"
              element={
                <AuthRequired>
                  <BookingSuccess />
                </AuthRequired>
              }
            />

            <Route
              path="/view-ticket/:bookingId"
              element={
                <AuthRequired>
                  <Header />
                  <Ticket />
                </AuthRequired>
              }
            />

            <Route
              path="/ticket/:pnr"
              element={
                <AuthRequired>
                  <Header />
                  <ETicket />
                </AuthRequired>
              }
            />

            {/* ================= AIRLINE ================= */}
            <Route
              path="/airline/*"
              element={
                <AuthRequired>
                  <AirlineDashboard />
                </AuthRequired>
              }
            />

            {/* ================= ADMIN ================= */}
            <Route
              path="/super-admin/*"
              element={
                <AuthRequired>
                  <SuperAdminDashboard />
                </AuthRequired>
              }
            />

            {/* ================= FALLBACK ================= */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
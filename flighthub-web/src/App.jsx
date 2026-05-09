import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
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

function App() {

  function RoleRedirect() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    useEffect(() => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        dispatch(getUserProfile());
      }
    }, [dispatch]);

    useEffect(() => {
      if (isAuthenticated && user) {
        switch (user.role) {
          case "ROLE_SYSTEM_ADMIN":
            navigate("/super-admin");
            break;

          case "ROLE_AIRLINE_OWNER":
            navigate("/airline");
            break;

          case "ROLE_CUSTOMER":
          default:
            navigate("/traveler");
            break;
        }
      }
    }, [isAuthenticated, user, navigate]);

    return null;
  }

  function AuthProtected({ children }) {
    const { isAuthenticated } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
      if (isAuthenticated) {
        navigate("/");
      }
    }, [isAuthenticated, navigate]);

    return children;
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background transition-colors">
          <Toaster />

          <Routes>

            {/* AUTH */}
            <Route
              path="/register"
              element={
                <AuthProtected>
                  <Auth isLogin={false} />
                </AuthProtected>
              }
            />

            <Route
              path="/login"
              element={
                <AuthProtected>
                  <Auth isLogin={true} />
                </AuthProtected>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <AuthProtected>
                  <ForgotPassword />
                </AuthProtected>
              }
            />

            <Route
              path="/reset-password/:token"
              element={
                <AuthProtected>
                  <ResetPassword />
                </AuthProtected>
              }
            />

            {/* LANDING */}
            <Route
              path="/"
              element={
                <>
                  <RoleRedirect />
                  <LandingPage />
                </>
              }
            />

            {/* ONBOARDING */}
            <Route
              path="/airline-onboarding"
              element={<AirlineOnboardingWizard />}
            />

            {/* TRAVELER */}
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
              path="/search-results"
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
                <>
                  <Header />
                  <BookingReview />
                </>
              }
            />

            <Route
              path="/payment"
              element={
                <>
                  <Header />
                  <PaymentPage />
                </>
              }
            />

            <Route
              path="/bookings"
              element={
                <>
                  <Header />
                  <BookingHistory />
                </>
              }
            />

            <Route
              path="/booking-success/:bookingId"
              element={<BookingSuccess />}
            />

            <Route
              path="/view-ticket/:bookingId"
              element={
                <>
                  <Header />
                  <Ticket />
                </>
              }
            />

            <Route
              path="/ticket/:pnr"
              element={
                <>
                  <Header />
                  <ETicket />
                </>
              }
            />

            <Route
              path="/ticket"
              element={
                <>
                  <Header />
                  <ETicket />
                </>
              }
            />

            <Route
              path="/profile"
              element={
                <>
                  <Header />
                  <UserProfile />
                </>
              }
            />

            {/* AIRLINE */}
            <Route path="/airline/*" element={<AirlineDashboard />} />

            {/* ADMIN */}
            <Route path="/super-admin/*" element={<SuperAdminDashboard />} />

          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
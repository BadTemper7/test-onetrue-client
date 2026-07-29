import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import VerifiedClientRoute from "./components/auth/VerifiedClientRoute"
import FormFieldValidation from "./components/FormFieldValidation"
import PageHelmet from "./components/meta/PageHelmet"
import Layout from "./components/layout/Layout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import BookingLookup from "./pages/BookingLookup"
import Home from "./pages/Home"
import Booking from "./pages/Booking"
import BookingHistory from "./pages/BookingHistory"
import About from "./pages/About"
import Profile from "./pages/Profile"
import Settings from "./pages/Settings"
import Rates from "./pages/Rates"
import TermsConditions from "./pages/TermsConditions"
import PrivacyPolicy from "./pages/PrivacyPolicy"

const ClientShell = () => <Layout><Outlet /></Layout>
const TitledPage = ({ title, children }) => <><PageHelmet title={title} />{children}</>

function App() {
  return (
    <>
      <FormFieldValidation />
      <Routes>
        <Route path="/login" element={<TitledPage title="Client Login"><Login /></TitledPage>} />
        <Route path="/register" element={<TitledPage title="Client Registration"><Register /></TitledPage>} />
        <Route path="/forgot-password" element={<TitledPage title="Forgot Password"><ForgotPassword type="client" /></TitledPage>} />
        <Route path="/booking-status" element={<TitledPage title="Booking Status"><BookingLookup /></TitledPage>} />
        <Route path="/terms-and-conditions" element={<TitledPage title="Terms and Conditions"><TermsConditions /></TitledPage>} />
        <Route path="/privacy-policy" element={<TitledPage title="Privacy Policy"><PrivacyPolicy /></TitledPage>} />

        <Route element={<ProtectedRoute userType="client" />}>
          <Route element={<ClientShell />}>
            <Route index element={<TitledPage title="Home"><Home /></TitledPage>} />
            <Route path="about" element={<TitledPage title="About"><About /></TitledPage>} />
            <Route path="profile" element={<TitledPage title="Profile"><Profile /></TitledPage>} />
            <Route path="settings" element={<TitledPage title="Settings"><Settings /></TitledPage>} />
            <Route path="rates" element={<TitledPage title="Rates and Payment Types"><Rates /></TitledPage>} />

            <Route element={<VerifiedClientRoute />}>
              <Route path="booking" element={<TitledPage title="New Booking"><Booking /></TitledPage>} />
              <Route path="booking-history" element={<TitledPage title="Booking History"><BookingHistory /></TitledPage>} />
              <Route path="pre-advice" element={<Navigate to="/booking" replace />} />
            </Route>
          </Route>
        </Route>

        <Route path="/client/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App

// components/layout/Layout.jsx
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuthStore } from "../../stores/authStore";
import { useSocket } from "../../hooks/useSocket";

const Layout = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  useSocket({ token, enabled: user?.userType === "client" });
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

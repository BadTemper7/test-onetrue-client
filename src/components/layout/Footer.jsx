// components/layout/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiGlobe, FiShield, FiMail } from "react-icons/fi";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs tracking-wide text-emerald-600 font-semibold">
              OTLI
            </span>
            <span>© {currentYear} Client Portal.</span>
            <span className="hidden sm:inline">All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 mt-2 sm:mt-0">
            <Link
              to="/privacy-policy"
              className="flex items-center space-x-1 hover:text-emerald-600 transition-colors duration-200"
            >
              <FiShield className="h-3.5 w-3.5" />
              <span>Privacy</span>
            </Link>
            <Link
              to="/terms-and-conditions"
              className="flex items-center space-x-1 hover:text-emerald-600 transition-colors duration-200"
            >
              <FiGlobe className="h-3.5 w-3.5" />
              <span>Terms</span>
            </Link>
            <a
              href="mailto:otli@onetrue.ph"
              className="flex items-center space-x-1 hover:text-emerald-600 transition-colors duration-200"
            >
              <FiMail className="h-3.5 w-3.5" />
              <span>Support</span>
            </a>
            <span className="flex items-center space-x-1 text-xs">
              <span>Made with</span>
              <FiHeart className="h-3 w-3 text-red-500 fill-red-500" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

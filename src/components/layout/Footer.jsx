import React from "react"
import { Link } from "react-router-dom"
import { FiGlobe, FiMail, FiMapPin, FiPhone, FiShield } from "react-icons/fi"
import { companyContact } from "../../constants/companyProfile"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black text-emerald-800">One True Logistics Inc.</p>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Your trusted container depot and logistics partner in the Port Area of Manila.</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              <a href={`mailto:${companyContact.email}`} className="inline-flex items-center gap-1.5 hover:text-emerald-700"><FiMail /> {companyContact.email}</a>
              <a href={`tel:${companyContact.mobile}`} className="inline-flex items-center gap-1.5 hover:text-emerald-700"><FiPhone /> {companyContact.mobile}</a>
              <span className="inline-flex items-center gap-1.5"><FiMapPin /> Port Area, Manila</span>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500" aria-label="Footer navigation">
            <Link to="/about" className="hover:text-emerald-700">About</Link>
            <Link to="/services" className="hover:text-emerald-700">Services</Link>
            <Link to="/contact" className="hover:text-emerald-700">Contact</Link>
            <Link to="/privacy-policy" className="inline-flex items-center gap-1 hover:text-emerald-700"><FiShield /> Privacy</Link>
            <Link to="/terms-and-conditions" className="inline-flex items-center gap-1 hover:text-emerald-700"><FiGlobe /> Terms</Link>
          </nav>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">© {currentYear} One True Logistics Inc. All rights reserved.</div>
      </div>
    </footer>
  )
}

export default Footer

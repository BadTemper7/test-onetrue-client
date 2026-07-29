// components/layout/Navbar.jsx

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiBookOpen,
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiHome,
  FiInfo,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUser,
  FiX,
} from "react-icons/fi";

import logo from "../../assets/logo.png";
import { useAuthStore } from "../../stores/authStore";

const Navbar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isVerified = ["active", "verified"].includes(user?.status);
  const location = useLocation();
  const profileRef = useRef(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navItems = [
    {
      icon: FiHome,
      label: "Home",
      path: "/",
    },
    {
      icon: FiBookOpen,
      label: "Booking",
      path: "/booking",
    },
    {
      icon: FiDollarSign,
      label: "Rates",
      path: "/rates",
    },
    {
      icon: FiInfo,
      label: "About",
      path: "/about",
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !["/booking", "/rates"].includes(item.path) || isVerified,
  );

  const profileMenuItems = [
    {
      icon: FiUser,
      label: "Profile",
      path: "/profile",
    },
    {
      icon: FiSettings,
      label: "Settings",
      path: "/settings",
    },
    {
      icon: FiClock,
      label: "Booking History",
      path: "/booking-history",
    },
  ];

  const userInitials = (user?.name || "Client")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Desktop and mobile navbar */}
        <div className="relative grid h-28 grid-cols-[1fr_auto_1fr] items-center gap-3 md:h-32">
          {/* Left side */}
          <div className="flex min-w-0 items-center justify-start">
            {/* Desktop navigation */}
            <nav
              className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 shadow-sm md:flex"
              aria-label="Main navigation"
            >
              {visibleNavItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={[
                      "group relative flex h-11 items-center gap-2 rounded-xl px-4",
                      "text-sm font-semibold transition-all duration-200",
                      active
                        ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/70"
                        : "text-slate-500 hover:bg-white hover:text-emerald-700",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-[18px] w-[18px] transition-all duration-200",
                        active
                          ? "text-emerald-600"
                          : "text-slate-400 group-hover:scale-110 group-hover:text-emerald-600",
                      ].join(" ")}
                    />

                    <span>{item.label}</span>

                    {active && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-emerald-600" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen((current) => !current);
                setIsProfileDropdownOpen(false);
              }}
              className={[
                "flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm",
                "transition-all duration-200 md:hidden",
                isMobileMenuOpen
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600",
              ].join(" ")}
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <FiX className="h-5 w-5" />
              ) : (
                <FiMenu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Center logo */}
          <Link
            to="/"
            className="group relative flex h-28 w-36 items-center justify-center overflow-hidden sm:w-44 md:h-32 md:w-48"
            aria-label="Go to homepage"
          >
            <div className="absolute inset-x-6 bottom-2 h-8 rounded-full bg-blue-100/70 blur-xl transition-colors group-hover:bg-blue-200/80" />

            <img
              src={logo}
              alt="One True Logistics Inc."
              className="
                absolute left-1/2 top-1/2
                h-48 w-48 max-w-none
                -translate-x-1/2 -translate-y-1/2
                object-contain
                transition-transform duration-300
                group-hover:scale-[1.03]
              "
            />
          </Link>

          {/* Right side */}
          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            {/* Notification */}
            <button
              type="button"
              aria-label="Open notifications"
              className="
                group relative flex h-11 w-11 shrink-0 items-center justify-center
                rounded-xl border border-slate-200 bg-white text-slate-500
                shadow-sm transition-all duration-200
                hover:-translate-y-0.5 hover:border-emerald-300
                hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md
              "
            >
              <FiBell className="h-5 w-5 transition-transform duration-200 group-hover:rotate-6" />

              <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
            </button>

            {/* Account */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileDropdownOpen((current) => !current);
                  setIsMobileMenuOpen(false);
                }}
                className={[
                  "flex h-14 items-center gap-2 rounded-2xl border bg-white p-2",
                  "shadow-sm transition-all duration-200 sm:gap-3 sm:pr-3",
                  isProfileDropdownOpen
                    ? "border-emerald-300 ring-4 ring-emerald-50"
                    : "border-slate-200 hover:border-emerald-300 hover:shadow-md",
                ].join(" ")}
                aria-haspopup="menu"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 text-sm font-bold text-white shadow-md shadow-emerald-200">
                  {userInitials}

                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
                </div>

                <div className="hidden min-w-0 text-left lg:block">
                  <p className="max-w-32 truncate text-sm font-bold text-slate-800">
                    {user?.name || "Client"}
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-slate-400">
                    {user?.companyName || "Client"}
                  </p>
                </div>

                <FiChevronDown
                  className={[
                    "hidden h-4 w-4 text-slate-400 transition-transform duration-200 sm:block",
                    isProfileDropdownOpen ? "rotate-180 text-emerald-600" : "",
                  ].join(" ")}
                />
              </button>

              {/* Account dropdown */}
              {isProfileDropdownOpen && (
                <div
                  role="menu"
                  className="
                    absolute right-0 top-full mt-3
                    w-[min(18rem,calc(100vw-2rem))]
                    origin-top-right overflow-hidden
                    rounded-3xl border border-slate-200
                    bg-white shadow-2xl shadow-slate-300/50
                  "
                >
                  <div className="bg-gradient-to-br from-emerald-600 to-blue-700 p-5 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold ring-1 ring-white/25">
                        {userInitials}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {user?.name || "Client"}
                        </p>

                        <p className="mt-1 truncate text-xs text-emerald-100">
                          {user?.email || ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                      <span className="text-xs text-emerald-100">
                        Account type
                      </span>

                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                        {user?.companyName || "Client"}
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    {profileMenuItems.map((item) => {
                      const active = isActive(item.path);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          role="menuitem"
                          className={[
                            "group flex items-center gap-3 rounded-2xl px-3 py-3",
                            "text-sm font-semibold transition-colors duration-200",
                            active
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                              active
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600",
                            ].join(" ")}
                          >
                            <Icon className="h-4 w-4" />
                          </span>

                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-100 p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-rose-600 transition-colors duration-200 hover:bg-rose-50"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 transition-colors group-hover:bg-rose-100">
                        <FiLogOut className="h-4 w-4" />
                      </span>

                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile navigation dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute left-0 right-0 top-full z-50 pt-3 md:hidden">
              <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-300/40">
                <div className="space-y-1">
                  {visibleNavItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={[
                          "flex items-center gap-3 rounded-2xl px-3 py-3",
                          "text-sm font-semibold transition-colors duration-200",
                          active
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            active
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5" />
                        </span>

                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="my-3 border-t border-slate-100" />

                <div className="space-y-1">
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-emerald-700"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <Icon className="h-5 w-5" />
                        </span>

                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-rose-600 transition-colors duration-200 hover:bg-rose-50"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                      <FiLogOut className="h-5 w-5" />
                    </span>

                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

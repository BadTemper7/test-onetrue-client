// pages/About.jsx
import React from "react";
import {
  FiTruck,
  FiPackage,
  FiGlobe,
  FiShield,
  FiClock,
  FiUsers,
  FiAward,
  FiHeart,
  FiTrendingUp,
  FiCheckCircle,
  FiBriefcase,
} from "react-icons/fi";

const About = () => {
  const features = [
    {
      icon: FiGlobe,
      title: "Global Network",
      description:
        "Access to shipping networks across the globe with reliable partners.",
    },
    {
      icon: FiShield,
      title: "Secure Shipping",
      description: "Your shipments are protected with insurance and tracking.",
    },
    {
      icon: FiClock,
      title: "Real-time Tracking",
      description:
        "Track your shipments in real-time with our advanced system.",
    },
    {
      icon: FiUsers,
      title: "Expert Team",
      description:
        "Dedicated professionals ensuring your shipments arrive safely.",
    },
  ];

  const stats = [
    { label: "Shipments Delivered", value: "50,000+" },
    { label: "Happy Clients", value: "2,500+" },
    { label: "Countries Served", value: "50+" },
    { label: "Years of Experience", value: "10+" },
  ];

  const values = [
    {
      icon: FiAward,
      title: "Excellence",
      description: "We strive for excellence in every shipment we handle.",
    },
    {
      icon: FiHeart,
      title: "Integrity",
      description: "Honest and transparent operations with our clients.",
    },
    {
      icon: FiTrendingUp,
      title: "Innovation",
      description: "Leveraging technology to improve logistics efficiency.",
    },
    {
      icon: FiUsers,
      title: "Customer Focus",
      description: "Putting our clients at the heart of everything we do.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 md:p-12 text-white">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            About Our Client Portal
          </h1>
          <p className="text-emerald-100 text-base md:text-lg">
            We provide comprehensive shipping and logistics solutions to clients
            worldwide. Our platform makes it easy to book, track, and manage
            your shipments efficiently.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <FiCheckCircle className="h-5 w-5" />
              <span className="text-sm">Trusted Partner</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <FiBriefcase className="h-5 w-5" />
              <span className="text-sm">10+ Years Experience</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-100"
          >
            <p className="text-2xl md:text-3xl font-bold text-emerald-600">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="bg-emerald-50 p-3 rounded-lg inline-block mb-4">
                <feature.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Values */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center"
            >
              <div className="bg-emerald-50 p-3 rounded-full inline-block mb-4">
                <value.icon className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">
                {value.title}
              </h3>
              <p className="text-sm text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Ready to Ship?
        </h2>
        <p className="text-gray-600 mb-4">
          Book your shipment now and experience seamless logistics.
        </p>
        <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-lg shadow-emerald-200/50 transition-all duration-200">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default About;

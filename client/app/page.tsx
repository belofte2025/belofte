"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "/warehouse-sales.png",
      title: "Real-Time Inventory Tracking",
      subtitle: "Never lose track of your stock again",
      description:
        "Monitor container arrivals, track inventory levels, and manage your warehouse operations seamlessly.",
      stats: [
        { label: "Containers Tracked", value: "200+" },
        { label: "Items Managed", value: "10K+" },
        { label: "Suppliers Connected", value: "50+" },
      ],
    },
    {
      image: "/warehouse-sales.png",
      title: "Customer Relationship Management",
      subtitle: "Build lasting relationships with your customers",
      description:
        "Track customer purchases, manage credit, send automated SMS notifications, and provide exceptional service.",
      stats: [
        { label: "Customer Profiles", value: "2500+" },
        { label: "SMS Notifications", value: "5K+/mo" },
        { label: "Payment Tracking", value: "99.9%" },
      ],
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-blue-950 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Image
                src="/icon/eyo.png"
                alt="EYO Solutions"
                width={40}
                height={40}
              />
              <span className="text-xl font-bold bg-gradient-to-r from-white/95 to-indigo-600 bg-clip-text text-transparent">
                EYO Solutions
              </span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Slider Section */}
      <section className="relative h-screen overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full"
            }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <div className="relative w-full h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    if (target.parentElement) {
                      target.parentElement.style.background =
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                    }
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl">
                  <div className="mb-6 inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
                    <span className="text-white/90 text-sm font-medium">
                      Business Management Platform
                    </span>
                  </div>

                  <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                    {slide.title}
                  </h1>

                  <p className="text-2xl text-blue-100 mb-4 font-medium">
                    {slide.subtitle}
                  </p>

                  <p className="text-lg text-gray-200 mb-8 leading-relaxed">
                    {slide.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {slide.stats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
                      >
                        <div className="text-3xl font-bold text-white mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-blue-100">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <Link
                      href="/login"
                      className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-full hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
                    >
                      Get Started
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full transition-all duration-200 group"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full transition-all duration-200 group"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-12 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 text-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/icon/eyo.png"
                  alt="EYO Solutions"
                  width={40}
                  height={40}
                />
                <span className="text-xl font-bold text-white">
                  EYO Solutions
                </span>
              </div>
              <p className="text-gray-400 max-w-md">
                Empowering businesses with modern management solutions for the
                digital age.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} EYO Solutions. All rights reserved |
              Contact: 0246462398
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

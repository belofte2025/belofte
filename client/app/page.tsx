"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";


export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Image
                  src="/icon/eyo.png"
                  alt="EYO Solutions Logo"
                  width={80}
                  height={80}
                  className="drop-shadow-lg"
                />
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Modern Business
              <span className="block bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Management
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your sales, inventory, and customer management with our
              comprehensive platform designed for modern businesses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-full hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-xl"
              >
                Login
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
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
              © {new Date().getFullYear()} EYO Solutions. All rights reserved
              0246462398.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plane,
  Shield,
  Globe,
  Users,
  CheckCircle,
  Star
} from 'lucide-react';

import LoginForm from './LoginForm';
import Register from './RegisterForm';

const Auth = ({ isLogin }) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Secure Infrastructure',
      desc: 'End-to-end encrypted transactions'
    },
    {
      icon: Globe,
      title: 'Global Distribution',
      desc: 'Access 1200+ routes worldwide'
    },
    {
      icon: Users,
      title: 'Scalable Platform',
      desc: 'Supports millions of bookings daily'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 min-h-screen flex">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">

          <div className="max-w-md">

            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-3 rounded-2xl shadow-lg">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">FlightHub</h1>
                <p className="text-blue-200 text-sm">
                  Global Flight Distribution Platform
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                Powering Real-Time
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {' '}Air Travel
                </span>
                <br />
                Infrastructure
              </h2>

              <p className="text-blue-200 text-lg leading-relaxed">
                FlightHub connects travelers and airlines through a scalable platform
                for real-time search, pricing, and booking.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-2 rounded-lg">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>

                  <div className="ml-4">
                    <h3 className="text-white font-semibold">{feature.title}</h3>
                    <p className="text-blue-200 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">99.95%</div>
                <div className="text-blue-200 text-sm">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-blue-200 text-sm">Support</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">1200+</div>
                <div className="text-blue-200 text-sm">Routes</div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">

          <div className="w-full max-w-md">

            <Card className="
              bg-white/95 backdrop-blur-xl border-0 shadow-2xl
              transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]
            ">
              <CardContent className="p-8">

                {/* Mobile logo */}
                <div className="lg:hidden flex items-center justify-center mb-8">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-gray-900">FlightHub</h1>
                  </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {isLogin ? "Access FlightHub" : "Create Your FlightHub Account"}
                  </h3>

                  <p className="text-gray-600">
                    {isLogin
                      ? "Sign in to manage bookings and platform access"
                      : "Join the platform for real-time flight search and booking"}
                  </p>

                  {/* Badges */}
                  <div className="flex justify-center gap-2 mt-4">
                    <Badge className="text-xs bg-blue-100 text-blue-700">
                      <Globe className="w-3 h-3 mr-1" />
                      Global Network
                    </Badge>

                    <Badge className="text-xs bg-purple-100 text-purple-700">
                      <Shield className="w-3 h-3 mr-1" />
                      Secure Platform
                    </Badge>
                  </div>
                </div>

                {/* Form */}
                {isLogin ? <LoginForm /> : <Register />}

              </CardContent>
            </Card>

            {/* Trust */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-6 text-white/70">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Secure Payment</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  <span className="text-sm">High Availability</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  <span className="text-sm">4.9/5 Platform Rating</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Auth;
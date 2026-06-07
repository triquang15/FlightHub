import { Link } from 'react-router-dom';
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-100 text-foreground dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">

      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-500/15" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl dark:bg-purple-500/15" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-70 dark:opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%232563eb' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">

          <div className="max-w-md">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center mb-8 no-underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 dark:from-blue-400 dark:to-purple-400">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">FlightHub</h1>
                <p className="text-sm text-slate-600 dark:text-blue-200">
                  Global Flight Distribution Platform
                </p>
              </div>
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-4xl xl:text-5xl font-bold text-slate-950 dark:text-white mb-4 leading-tight">
                Powering Real-Time
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  {' '}Air Travel
                </span>
                <br />
                Infrastructure
              </h2>

              <p className="text-lg leading-relaxed text-slate-600 dark:text-blue-200">
                FlightHub connects travelers and airlines through a scalable platform
                for real-time search, pricing, and booking.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center rounded-xl border border-blue-100/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg dark:from-blue-400 dark:to-purple-400">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>

                  <div className="ml-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-blue-200">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-950 dark:text-white">99.95%</div>
                <div className="text-sm text-slate-600 dark:text-blue-200">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-950 dark:text-white">24/7</div>
                <div className="text-sm text-slate-600 dark:text-blue-200">Support</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-950 dark:text-white">1200+</div>
                <div className="text-sm text-slate-600 dark:text-blue-200">Routes</div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex w-full flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:w-1/2 lg:p-12">

          <div className="w-full max-w-md">

            <Card className="
              border border-border/70 bg-card/95 shadow-2xl shadow-blue-950/10 backdrop-blur-xl
              transition-all duration-300 dark:bg-slate-950/80 dark:shadow-black/30
            ">
              <CardContent className="p-5 sm:p-8">

                {/* Mobile logo */}
                <Link
                  to="/"
                  className="lg:hidden flex items-center justify-center mb-8 no-underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-foreground">FlightHub</h1>
                  </div>
                </Link>

                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                    {isLogin ? "Access FlightHub" : "Create Your FlightHub Account"}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    {isLogin
                      ? "Sign in to manage bookings and platform access"
                      : "Join the platform for real-time flight search and booking"}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge className="text-xs border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                      <Globe className="w-3 h-3 mr-1" />
                      Global Network
                    </Badge>

                    <Badge className="text-xs border border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
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
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-slate-600 dark:text-white/70">
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

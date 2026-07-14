import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  Clock3,
  Globe,
  Plane,
  Radar,
  Shield,
  TicketCheck,
} from 'lucide-react';

import LoginForm from './LoginForm';
import Register from './RegisterForm';

const platformHighlights = [
  { icon: Shield, title: 'Secure access', desc: 'Role-aware login, gateway logout, and rate-limited APIs.' },
  { icon: TicketCheck, title: 'Booking ready', desc: 'Search, fare selection, seats, payments, and tickets.' },
  { icon: Activity, title: 'Observable ops', desc: 'Grafana, Prometheus, Loki, and notification operations.' },
];

const trustStats = [
  { label: 'Service health', value: 'Live' },
  { label: 'Payment rails', value: '2' },
  { label: 'Search modes', value: '3' },
];

const Auth = ({ isLogin }) => {
  return (
    <div className="auth-scene-bg relative min-h-screen overflow-hidden text-slate-950 dark:text-white">
      <div className="absolute inset-0 -z-20">
        <img
          src="https://images.unsplash.com/photo-1483450388369-9ed95738483c?auto=format&fit=crop&w=2400&q=85"
          alt=""
          className="h-full w-full object-cover opacity-18 mix-blend-multiply dark:opacity-24 dark:mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.84)_0%,rgba(248,250,252,0.74)_52%,rgba(224,242,254,0.7)_100%)] dark:bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.9)_52%,rgba(8,47,73,0.58)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(14,165,233,0.2),transparent_30%),linear-gradient(0deg,rgba(255,255,255,0.9),transparent_45%)] dark:bg-[radial-gradient(circle_at_75%_18%,rgba(56,189,248,0.34),transparent_30%),linear-gradient(0deg,rgba(2,6,23,1),transparent_45%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 opacity-55 dark:opacity-45">
        <div className="absolute left-1/2 top-24 h-px w-[42rem] -translate-x-1/2 rotate-[-15deg] bg-gradient-to-r from-transparent via-primary/60 to-transparent dark:via-white" />
        <motion.div
          className="absolute left-[10%] top-[30%] flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-white/50 text-primary backdrop-blur-xl dark:border-white/20 dark:bg-white/10 dark:text-white"
          animate={{ x: ['0vw', '58vw'], y: [0, -86, -14], rotate: [0, 14, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Plane className="h-4 w-4" />
        </motion.div>
      </div>

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/40">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 dark:bg-white dark:text-primary">
              <Plane className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight">FlightHub</span>
              <span className="hidden text-xs text-slate-600 sm:block dark:text-white/55">Travel and operations platform</span>
            </span>
          </Link>

          <Link
            to={isLogin ? '/register' : '/login'}
            className="hidden rounded-full border border-slate-200 bg-white/65 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur-xl transition hover:bg-white hover:text-slate-950 sm:inline-flex dark:border-white/15 dark:bg-white/8 dark:text-white/80 dark:hover:bg-white/12 dark:hover:text-white"
          >
            {isLogin ? 'Create account' : 'Sign in'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <motion.section
          className="hidden max-w-2xl lg:block"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/60 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/10 dark:text-white/90">
            <Radar className="h-4 w-4 text-primary dark:text-cyan-200" />
            Secure workspace access
          </div>

          <h1 className="mt-7 text-5xl font-semibold leading-[1.03] tracking-tight xl:text-6xl">
            Sign in to the system behind the journey.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            One account layer connects traveler booking, airline operations, super admin controls, notifications, and observability.
          </p>

          <div className="mt-10 grid gap-4">
            {platformHighlights.map(({ icon: Icon, title, desc }, index) => (
              <motion.div
                key={title}
                className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/8"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + index * 0.08 }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground dark:bg-white dark:text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">{desc}</span>
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {trustStats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/8">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="mx-auto w-full max-w-md"
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
        >
          <div className="relative">
              <div className="absolute -left-4 top-10 hidden rounded-3xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl [animation:float-panel_6s_ease-in-out_infinite] sm:block dark:border-white/10 dark:bg-white/10">
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                Verified access
              </span>
            </div>
              <div className="absolute -right-4 bottom-12 hidden rounded-3xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-xl [animation:float-panel_7s_ease-in-out_infinite_reverse] sm:block dark:border-white/10 dark:bg-white/10">
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-cyan-200" />
                Session aware
              </span>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/50 p-2 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl dark:border-white/15 dark:bg-white/10 dark:shadow-black/30">
              <div className="auth-glass-card rounded-[1.55rem] border border-white/70 p-5 text-foreground sm:p-7 dark:border-white/10">
                <Link to="/" className="mb-7 flex items-center justify-center gap-3 lg:hidden">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Plane className="h-5 w-5" />
                  </span>
                  <span className="text-xl font-bold">FlightHub</span>
                </Link>

                <div className="mb-7 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {isLogin ? <Shield className="h-6 w-6" /> : <Globe className="h-6 w-6" />}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {isLogin ? 'Welcome back' : 'Create traveler account'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {isLogin
                      ? 'Access bookings, airline operations, or platform controls with your role.'
                      : 'Start with a customer account. Airline and admin access use approval flows.'}
                  </p>
                </div>

                {isLogin ? <LoginForm /> : <Register />}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-white/68">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Secure checkout
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Protected sessions
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              Global routes
            </span>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Auth;

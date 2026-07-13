import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  CheckCircle,
  Clock3,
  ClipboardCheck,
  MailCheck,
  Plane,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const SuccessScreen = ({ airlineData }) => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('airline_onboarding_progress');
  }, []);

  const handleGoToDashboard = () => {
    navigate('/airline');
  };

  const reviewSteps = [
    {
      icon: ClipboardCheck,
      title: 'Application received',
      description: 'Your airline profile is saved with pending approval status.',
    },
    {
      icon: ShieldCheck,
      title: 'Operations review',
      description: 'A system admin will verify business details and platform readiness.',
    },
    {
      icon: MailCheck,
      title: 'Approval follow-up',
      description: 'You can continue preparing your workspace while approval is pending.',
    },
  ];

  return (
    <div className="relative app-page-surface min-h-screen overflow-hidden text-slate-950 dark:text-white">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.22),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.18),transparent_62%)]" />
      <div className="absolute left-1/2 top-20 h-36 w-36 -translate-x-1/2 animate-[success-breathe_5s_ease-in-out_infinite] rounded-full border border-emerald-300/40 opacity-70 blur-sm dark:border-emerald-300/20" />
      <div className="absolute left-[18%] top-32 hidden h-2 w-2 animate-pulse rounded-full bg-emerald-400/70 sm:block" />
      <div className="absolute right-[22%] top-44 hidden h-2 w-2 animate-pulse rounded-full bg-blue-400/70 sm:block" />
      <div className="absolute left-0 top-0 h-px w-full animate-[success-sweep_4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white/95 text-slate-950 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:shadow-black/30">
          <CardContent className="p-0">
            <div className="relative overflow-hidden border-b border-slate-200 bg-slate-50/80 px-5 py-10 text-center dark:border-white/10 dark:bg-white/[0.03] sm:px-10">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <div className="absolute inset-0 animate-[success-ping_2.4s_ease-out_infinite] rounded-2xl border border-emerald-400/40" />
                <CheckCircle className="h-11 w-11 animate-[success-pop_700ms_ease-out_both]" />
              </div>

              <Badge variant="outline" className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                Submitted for review
              </Badge>

              <h1 className="animate-[success-rise_650ms_ease-out_120ms_both] text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Registration Submitted
              </h1>
              <p className="mx-auto mt-4 max-w-2xl animate-[success-rise_650ms_ease-out_220ms_both] text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                Your airline onboarding request is now pending Super Admin approval. You can continue into the airline workspace and prepare operational data while the review is in progress.
              </p>
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <section className="border-b border-slate-200 p-5 dark:border-white/10 sm:p-8 lg:border-b-0 lg:border-r">
                <div className="animate-[success-rise_650ms_ease-out_280ms_both] rounded-lg border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/60">
                      {airlineData?.logoUrl ? (
                        <img
                          src={airlineData.logoUrl}
                          alt={`${airlineData.airlineName || 'Airline'} logo`}
                          className="h-10 w-10 object-contain"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Plane className="h-7 w-7 text-blue-600 dark:text-blue-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Airline profile</p>
                      <h2 className="mt-1 truncate text-xl font-semibold text-slate-950 dark:text-white">
                        {airlineData?.airlineName || 'New airline'}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {airlineData?.iataCode && (
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 font-mono text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                            {airlineData.iataCode}
                          </Badge>
                        )}
                        {airlineData?.icaoCode && (
                          <Badge variant="outline" className="border-violet-200 bg-violet-50 font-mono text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
                            {airlineData.icaoCode}
                          </Badge>
                        )}
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                          PENDING
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 animate-[success-rise_650ms_ease-out_360ms_both] rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 text-blue-700 dark:text-blue-300" />
                    <div>
                      <p className="font-semibold text-blue-950 dark:text-blue-100">Approval required</p>
                      <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-200">
                        The airline is not visible in public booking flows until a system admin approves it.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="p-5 sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950 dark:text-white">What happens next</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">A clear review path before activation.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reviewSteps.map(({ icon: Icon, title, description }, index) => (
                    <div
                      key={title}
                      className="rounded-lg border border-slate-200 bg-white/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-slate-950/50 dark:hover:border-emerald-900/60"
                      style={{ animation: `success-rise 650ms ease-out ${420 + index * 90}ms both` }}
                    >
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step {index + 1}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex animate-[success-rise_650ms_ease-out_760ms_both] flex-col gap-3 sm:flex-row">
                  <Button onClick={handleGoToDashboard} className="h-11 flex-1 rounded-lg">
                    Go to Airline Workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/')} className="h-11 rounded-lg">
                    Back to Home
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                  You can update airline details and support contacts from your workspace after approval.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
      <style>{`
        @keyframes success-rise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes success-pop {
          0% {
            opacity: 0;
            transform: scale(0.72) rotate(-8deg);
          }
          70% {
            opacity: 1;
            transform: scale(1.08) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }

        @keyframes success-ping {
          0% {
            opacity: 0.65;
            transform: scale(0.92);
          }
          80%, 100% {
            opacity: 0;
            transform: scale(1.32);
          }
        }

        @keyframes success-breathe {
          0%, 100% {
            opacity: 0.45;
            transform: translateX(-50%) scale(0.96);
          }
          50% {
            opacity: 0.8;
            transform: translateX(-50%) scale(1.08);
          }
        }

        @keyframes success-sweep {
          0%, 100% {
            opacity: 0;
            transform: translateX(-40%);
          }
          45%, 55% {
            opacity: 1;
          }
          100% {
            transform: translateX(40%);
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessScreen;

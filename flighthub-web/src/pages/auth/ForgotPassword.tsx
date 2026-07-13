import { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Globe, Loader2, LockKeyhole, Mail, Plane, Shield, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword } from '../../Redux/auth/authThunk';
import { clearForgotPasswordState } from '../../Redux/auth/authSlice';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .lowercase()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

const initialValues = {
  email: '',
};

const ForgotPassword = () => {
  const dispatch = useDispatch<any>();
  const [submittedEmail, setSubmittedEmail] = useState('');
  const {
    forgotPasswordLoading,
    forgotPasswordError,
    forgotPasswordSuccess,
  } = useSelector((state: any) => state.auth);

  useEffect(() => {
    dispatch(clearForgotPasswordState());

    return () => {
      dispatch(clearForgotPasswordState());
    };
  }, [dispatch]);

  const handleSubmit = async (values: typeof initialValues, { setSubmitting }: any) => {
    const email = values.email.trim().toLowerCase();

    try {
      setSubmittedEmail(email);
      await dispatch(forgotPassword(email)).unwrap();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-scene-bg relative min-h-screen overflow-hidden text-slate-950 dark:text-white">
      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 animate-float rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute right-0 top-0 h-72 w-72 animate-float rounded-full bg-purple-500/15 blur-3xl dark:bg-purple-500/20" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 animate-float rounded-full bg-cyan-500/10 blur-3xl dark:bg-pink-500/20" style={{ animationDelay: '4s' }} />
      </div>

      <div
        className="absolute inset-0 opacity-40 dark:opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 min-h-screen lg:flex">
        <section className="hidden flex-col justify-center px-12 xl:flex xl:w-1/2 xl:px-20">
          <div className="max-w-md">
            <Link
              to="/"
              className="mb-8 flex items-center rounded-xl no-underline focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <div className="rounded-2xl bg-gradient-to-r from-blue-400 to-purple-400 p-3 shadow-lg">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">FlightHub</h1>
                <p className="text-sm text-slate-600 dark:text-blue-200">Global Flight Distribution Platform</p>
              </div>
            </Link>

            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-primary/15 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
              <ShieldCheck className="h-4 w-4 text-primary dark:text-blue-300" />
              Secure account recovery
            </div>

            <h2 className="mb-4 text-4xl font-bold leading-tight text-slate-950 dark:text-white xl:text-5xl">
              Reset access to your
              <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                {' '}FlightHub
              </span>
              <br />
              account
            </h2>

            <p className="text-lg leading-relaxed text-slate-600 dark:text-blue-200">
              We send a time-limited reset link and keep account existence private.
              After a successful reset, existing sessions are revoked for protection.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center rounded-xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-sm dark:border-white/20 dark:bg-white/10">
                <div className="rounded-lg bg-gradient-to-r from-primary to-sky-500 p-2 dark:from-blue-400 dark:to-purple-400">
                  <LockKeyhole className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-slate-950 dark:text-white">15 minute reset window</h3>
                  <p className="text-sm text-slate-600 dark:text-blue-200">Links expire quickly to reduce account risk.</p>
                </div>
              </div>

              <div className="flex items-center rounded-xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-sm dark:border-white/20 dark:bg-white/10">
                <div className="rounded-lg bg-gradient-to-r from-primary to-sky-500 p-2 dark:from-blue-400 dark:to-purple-400">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-slate-950 dark:text-white">Privacy preserving</h3>
                  <p className="text-sm text-slate-600 dark:text-blue-200">The response does not reveal registered emails.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen w-full items-center justify-center p-6 lg:p-12 xl:w-1/2">
          <div className="w-full max-w-md">
            <Card className="auth-glass-card border border-white/70 text-foreground backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 dark:border-white/10">
              <CardContent className="p-8">
                <Link
                  to="/"
                  className="mb-8 flex items-center justify-center rounded-xl no-underline focus:outline-none focus:ring-2 focus:ring-blue-400 xl:hidden"
                >
                  <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-3">
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-foreground">FlightHub</h1>
                  </div>
                </Link>

                <div className="mb-8 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-foreground">Forgot password?</h2>
                  <p className="text-muted-foreground">
                    Enter your email and we will send reset instructions.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Badge className="bg-blue-100 text-xs text-blue-700">
                      <Globe className="mr-1 h-3 w-3" />
                      Global Network
                    </Badge>
                    <Badge className="bg-purple-100 text-xs text-purple-700">
                      <Shield className="mr-1 h-3 w-3" />
                      Secure Platform
                    </Badge>
                  </div>
                </div>

                {forgotPasswordSuccess ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                      <div>
                        <p className="font-medium text-emerald-950">Check your inbox</p>
                        <p className="mt-1 text-sm leading-6 text-emerald-800">
                          If an account exists for {submittedEmail || 'that email'}, a reset link has been sent.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                  >
                    {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                      <Form className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center text-sm font-medium text-foreground">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            Email address
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={forgotPasswordLoading || isSubmitting}
                            className={`h-12 rounded-xl px-4 focus:border-primary focus:ring-primary/20 ${
                              touched.email && errors.email ? 'border-red-500 focus-visible:ring-red-200' : ''
                            }`}
                          />
                          {touched.email && errors.email && (
                            <p className="text-sm text-red-600">{errors.email}</p>
                          )}
                        </div>

                        {forgotPasswordError && (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {forgotPasswordError}
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="h-12 w-full rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                          disabled={forgotPasswordLoading || isSubmitting}
                        >
                          {forgotPasswordLoading || isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending reset link...
                            </>
                          ) : (
                            'Send reset link'
                          )}
                        </Button>
                      </Form>
                    )}
                  </Formik>
                )}

                <div className="mt-6 text-center">
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 hover:text-primary" asChild>
                    <Link to="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Link>
                  </Button>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Check spam or wait a minute before requesting another link.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ForgotPassword;

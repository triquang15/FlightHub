import { useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  LockKeyhole,
  Plane,
  Shield,
  ShieldCheck
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PasswordField from '../../components/PasswordField';
import { resetPassword } from '../../Redux/auth/authThunk';
import { clearResetPasswordState } from '../../Redux/auth/authSlice';

const validationSchema = Yup.object().shape({
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be 64 characters or less')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

const initialValues = {
  newPassword: '',
  confirmPassword: '',
};

const ResetPassword = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const resetToken = (token || searchParams.get('token') || '').trim();
  const {
    resetPasswordLoading,
    resetPasswordError,
    resetPasswordSuccess
  } = useSelector((state: any) => state.auth);

  useEffect(() => {
    dispatch(clearResetPasswordState());

    return () => {
      dispatch(clearResetPasswordState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!resetPasswordSuccess) return undefined;

    const timer = window.setTimeout(() => {
      navigate('/login', { state: { success: 'Your password has been reset successfully!' } });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [resetPasswordSuccess, navigate]);

  const handleSubmit = async (values: typeof initialValues, { setSubmitting }: any) => {
    if (!resetToken) {
      setSubmitting(false);
      return;
    }

    try {
      await dispatch(resetPassword({ token: resetToken, newPassword: values.newPassword })).unwrap();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-72 w-72 animate-float rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 animate-float rounded-full bg-purple-500/20 blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 animate-float rounded-full bg-pink-500/20 blur-3xl" style={{ animationDelay: '4s' }} />
      </div>

      <div
        className="absolute inset-0 opacity-30"
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
                <h1 className="text-2xl font-bold text-white">FlightHub</h1>
                <p className="text-sm text-blue-200">Global Flight Distribution Platform</p>
              </div>
            </Link>

            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-blue-100 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-blue-300" />
              Password reset in progress
            </div>

            <h2 className="mb-4 text-4xl font-bold leading-tight text-white xl:text-5xl">
              Create a stronger
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {' '}FlightHub
              </span>
              <br />
              password
            </h2>

            <p className="text-lg leading-relaxed text-blue-200">
              Choose a password with uppercase, lowercase, and a number. Once changed,
              active sessions are revoked so your account starts clean.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <div className="rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 p-2">
                  <LockKeyhole className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-white">Token protected</h3>
                  <p className="text-sm text-blue-200">Only valid reset links can update credentials.</p>
                </div>
              </div>

              <div className="flex items-center rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <div className="rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 p-2">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-white">Session cleanup</h3>
                  <p className="text-sm text-blue-200">You will sign in again after reset succeeds.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen w-full items-center justify-center p-6 lg:p-12 xl:w-1/2">
          <div className="w-full max-w-md">
            <Card className="border-0 bg-white/95 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <CardContent className="p-8">
                <Link
                  to="/"
                  className="mb-8 flex items-center justify-center rounded-xl no-underline focus:outline-none focus:ring-2 focus:ring-blue-400 xl:hidden"
                >
                  <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-3">
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-gray-900">FlightHub</h1>
                  </div>
                </Link>

                <div className="mb-8 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">Reset your password</h2>
                  <p className="text-gray-600">
                    Set a new password for your FlightHub account.
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

                {!resetToken && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-red-700" />
                      <div>
                        <p className="font-medium text-red-950">Reset link is missing</p>
                        <p className="mt-1 text-sm leading-6 text-red-700">
                          Please request a new password reset email and open the link from your inbox.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {resetPasswordSuccess ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                      <div>
                        <p className="font-medium text-emerald-950">Password updated</p>
                        <p className="mt-1 text-sm leading-6 text-emerald-800">
                          Your password has been reset. Redirecting to sign in...
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
                    {({ isSubmitting }) => (
                      <Form className={`space-y-5 ${resetPasswordLoading ? 'pointer-events-none opacity-70' : ''}`}>
                        {resetPasswordError && (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {resetPasswordError}
                          </div>
                        )}

                        <PasswordField
                          label="New password"
                          name="newPassword"
                          placeholder="Enter your new password"
                          disabled={!resetToken || isSubmitting || resetPasswordLoading}
                        />

                        <PasswordField
                          label="Confirm password"
                          name="confirmPassword"
                          placeholder="Confirm your new password"
                          disabled={!resetToken || isSubmitting || resetPasswordLoading}
                        />

                        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                          Use 8-64 characters with at least one uppercase letter, one lowercase letter, and one number.
                        </div>

                        <Button
                          type="submit"
                          className="w-full font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                          disabled={!resetToken || isSubmitting || resetPasswordLoading}
                        >
                          {isSubmitting || resetPasswordLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating password...
                            </>
                          ) : (
                            'Reset password'
                          )}
                        </Button>
                      </Form>
                    )}
                  </Formik>
                )}

                <div className="mt-6 text-center">
                  <Button variant="ghost" className="text-primary hover:bg-blue-50 hover:text-primary" asChild>
                    <Link to="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Link>
                  </Button>
                  {!resetToken && (
                    <p className="mt-3 text-sm text-gray-500">
                      Need a fresh link? <Link to="/forgot-password" className="font-medium text-primary hover:underline">Request reset email</Link>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ResetPassword;

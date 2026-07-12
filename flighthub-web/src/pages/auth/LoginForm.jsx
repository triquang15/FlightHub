import InputField from '@/components/InputField';
import PasswordField from '@/components/PasswordField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { appleLogin, googleLogin, login } from '@/Redux/auth/authThunk';
import { Form, Formik } from 'formik';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { getSafeRedirectForRole } from '@/utils/roleRedirect';

const LoginForm = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const googleButtonRef = React.useRef(null);
  const [googleReady, setGoogleReady] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [appleReady, setAppleReady] = React.useState(false);
  const [appleLoading, setAppleLoading] = React.useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  const appleRedirectUri = import.meta.env.VITE_APPLE_REDIRECT_URI || `${window.location.origin}/login`;

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .required('Email is required')
      .email('Invalid email format'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
  });

  const initialValues = {
    email: '',
    password: '',
    rememberMe: false
  };

  const getRedirectTarget = () => {
    const searchParams = new URLSearchParams(location.search);
    const queryRedirect = searchParams.get('redirect');
    const stateRedirect = location.state?.from
      ? `${location.state.from.pathname || ''}${location.state.from.search || ''}`
      : null;
    const target = stateRedirect || queryRedirect;

    if (!target || !target.startsWith('/') || target.startsWith('//')) {
      return null;
    }

    return target;
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await dispatch(login(values)).unwrap();

      const role = result.user?.role;
      const redirectTarget = getRedirectTarget();

      navigate(getSafeRedirectForRole(role, redirectTarget), { replace: true });

    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const redirectAfterAuth = React.useCallback((authResponse) => {
    const role = authResponse.user?.role;
    const redirectTarget = getRedirectTarget();
    navigate(getSafeRedirectForRole(role, redirectTarget), { replace: true });
  }, [navigate, location.search, location.state]);

  React.useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      setGoogleReady(false);
      return;
    }

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response?.credential) {
            toast.error("Google did not return a login credential");
            return;
          }

          try {
            setGoogleLoading(true);
            const authResponse = await dispatch(googleLogin({
              idToken: response.credential,
              rememberMe: true,
            })).unwrap();
            redirectAfterAuth(authResponse);
          } catch (err) {
            console.error("Google sign-in failed:", err);
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: googleButtonRef.current.offsetWidth || 320,
        text: "signin_with",
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    const script = existingScript || document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      if (!cancelled) {
        setGoogleReady(false);
        toast.error("Could not load Google Sign-In. Please try again later.");
      }
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [dispatch, googleClientId, redirectAfterAuth]);

  React.useEffect(() => {
    if (!appleClientId) {
      setAppleReady(false);
      return;
    }

    let cancelled = false;

    const initializeApple = () => {
      if (cancelled || !window.AppleID?.auth) return;

      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: "name email",
        redirectURI: appleRedirectUri,
        usePopup: true,
      });
      setAppleReady(true);
    };

    if (window.AppleID?.auth) {
      initializeApple();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector('script[src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"]');
    const script = existingScript || document.createElement("script");

    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.defer = true;
    script.onload = initializeApple;
    script.onerror = () => {
      if (!cancelled) {
        setAppleReady(false);
        toast.error("Could not load Apple Sign-In. Please try again later.");
      }
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [appleClientId, appleRedirectUri]);

  const handleAppleSignIn = async () => {
    if (!appleClientId) {
      toast.warning("Apple login is not configured. Add VITE_APPLE_CLIENT_ID and APPLE_CLIENT_ID.");
      return;
    }

    if (!window.AppleID?.auth) {
      toast.warning("Apple Sign-In is still loading. Please try again.");
      return;
    }

    try {
      setAppleLoading(true);
      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;

      if (!idToken) {
        toast.error("Apple did not return a login credential");
        return;
      }

      const name = response?.user?.name;
      const fullName = [name?.firstName, name?.lastName].filter(Boolean).join(" ");
      const authResponse = await dispatch(appleLogin({
        idToken,
        fullName,
        rememberMe: true,
      })).unwrap();
      redirectAfterAuth(authResponse);
    } catch (err) {
      if (err?.error !== "popup_closed_by_user") {
        console.error("Apple sign-in failed:", err);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className={`space-y-5 sm:space-y-6 ${loading && !googleLoading ? 'opacity-70 pointer-events-none' : ''}`}>

          {/* Error */}
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <AlertDescription className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center">
              <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
              Email Address
            </label>
            <InputField
              name="email"
              placeholder="Enter your email"
              type="email"
              className="h-12 px-4 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center">
              <Lock className="w-4 h-4 mr-2 text-muted-foreground" />
              Password
            </label>
            <PasswordField
              name="password"
              placeholder="Enter your password"
              className="h-12 px-4 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl"
            />
          </div>

          {/* Remember */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center">
              <input
                name="rememberMe"
                type="checkbox"
                checked={values.rememberMe}
                onChange={(event) => setFieldValue('rememberMe', event.target.checked)}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary dark:bg-slate-900"
              />
              <span className="ml-2 text-sm text-muted-foreground">Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
            disabled={isSubmitting || loading}
          >
            {(isSubmitting || loading) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Access Platform
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="text-center text-sm text-muted-foreground">
            Or sign in using
          </div>

          {/* Social */}
          <div className="grid gap-3">

            {/* Google */}
            {googleClientId ? (
              <div className="relative min-h-11 overflow-hidden rounded-xl border bg-background/60">
                <div ref={googleButtonRef} className="flex min-h-11 w-full items-center justify-center" />
                {(googleLoading || !googleReady) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm font-medium text-muted-foreground backdrop-blur-sm">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {googleLoading ? "Signing in with Google..." : "Loading Google..."}
                  </div>
                )}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl bg-background/60"
                onClick={() => toast.warning("Google login is not configured. Add VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.")}
              >
                <GoogleLogo />
                <span className="ml-2 text-sm">Google unavailable</span>
              </Button>
            )}

            {/* Apple */}
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl bg-background/60 font-semibold"
              disabled={appleLoading || (appleClientId && !appleReady)}
              onClick={handleAppleSignIn}
            >
              {appleLoading || (appleClientId && !appleReady) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AppleLogo />
              )}
              <span className="ml-2 text-sm">
                {appleClientId
                  ? appleLoading
                    ? "Signing in with Apple..."
                    : appleReady
                      ? "Continue with Apple"
                      : "Loading Apple..."
                  : "Apple unavailable"}
              </span>
            </Button>

          </div>

          {/* Register */}
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Don’t have an account?{' '}
              <Link
                to="/register"
                className="text-primary font-semibold hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>

        </Form>
      )}
    </Formik>
  );
};

const GoogleLogo = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.23 3.6l6.9-6.9C35.8 2.4 30.3 0 24 0 14.6 0 6.4 5.4 2.6 13.3l8.1 6.3C12.5 13.4 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.7-.2-3.3-.5-4.8H24v9.1h12.7c-.5 2.7-2 5-4.2 6.5l6.5 5c3.8-3.5 6-8.7 6-15.8z" />
    <path fill="#FBBC05" d="M10.7 28.6c-.6-1.8-1-3.7-1-5.6s.4-3.8 1-5.6l-8.1-6.3C.9 14.7 0 18.3 0 23s.9 8.3 2.6 11.9l8.1-6.3z" />
    <path fill="#34A853" d="M24 46c6.3 0 11.6-2.1 15.5-5.7l-6.5-5c-1.8 1.2-4.1 2-7 2-6.2 0-11.5-3.9-13.3-9.1l-8.1 6.3C6.4 40.6 14.6 46 24 46z" />
  </svg>
);

const AppleLogo = () => (
  <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 12.57c-.03-3.18 2.6-4.7 2.72-4.78-1.48-2.16-3.78-2.46-4.6-2.49-1.96-.2-3.82 1.15-4.82 1.15-.99 0-2.52-1.12-4.14-1.09-2.13.03-4.1 1.24-5.2 3.15-2.22 3.85-.57 9.56 1.6 12.68 1.06 1.53 2.32 3.25 3.98 3.19 1.6-.06 2.2-1.03 4.13-1.03 1.92 0 2.47 1.03 4.16 1 1.72-.03 2.81-1.56 3.86-3.1 1.22-1.78 1.72-3.51 1.75-3.6-.04-.02-3.35-1.28-3.44-5.08ZM13.9 3.24C14.78 2.17 15.37.69 15.21-.78c-1.27.05-2.8.85-3.71 1.91-.81.94-1.52 2.45-1.33 3.89 1.41.11 2.85-.72 3.73-1.78Z" />
  </svg>
);

export default LoginForm;

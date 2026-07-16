import InputField from '@/components/InputField';
import PasswordField from '@/components/PasswordField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { facebookLogin, googleLogin, login } from '@/Redux/auth/authThunk';
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
  const googleRedirectHandledRef = React.useRef(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [facebookReady, setFacebookReady] = React.useState(false);
  const [facebookLoading, setFacebookLoading] = React.useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

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

  const getRedirectTarget = React.useCallback(() => {
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
  }, [location.search, location.state]);

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
  }, [navigate, getRedirectTarget]);

  const createGoogleNonce = React.useCallback(() => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  React.useEffect(() => {
    if (!facebookAppId) {
      return;
    }

    let cancelled = false;

    const initializeFacebook = () => {
      if (cancelled || !window.FB) return;

      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: "v20.0",
      });
      setFacebookReady(true);
    };

    if (window.FB) {
      initializeFacebook();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector('script[src="https://connect.facebook.net/en_US/sdk.js"]');
    const script = existingScript || document.createElement("script");

    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = initializeFacebook;
    script.onerror = () => {
      if (!cancelled) {
        setFacebookReady(false);
        toast.error("Could not load Facebook Login. Please try again later.");
      }
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [facebookAppId]);

  React.useEffect(() => {
    if (!googleClientId) {
      return;
    }

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const idToken = params.get("id_token");
    const state = params.get("state");
    const savedState = window.sessionStorage.getItem("flighthub_google_oauth_state");

    if (!idToken) {
      return;
    }

    if (googleRedirectHandledRef.current) {
      return;
    }

    googleRedirectHandledRef.current = true;

    if (!state || !savedState || state !== savedState) {
      toast.error("Google login state could not be verified. Please try again.");
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      return;
    }

    const completeGoogleRedirectLogin = async () => {
      try {
        setGoogleLoading(true);
        const authResponse = await dispatch(googleLogin({
          idToken,
          rememberMe: true,
        })).unwrap();
        window.sessionStorage.removeItem("flighthub_google_oauth_state");
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        redirectAfterAuth(authResponse);
      } catch (err) {
        console.error("Google redirect sign-in failed:", err);
        window.sessionStorage.removeItem("flighthub_google_oauth_state");
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      } finally {
        setGoogleLoading(false);
      }
    };

    completeGoogleRedirectLogin();
  }, [dispatch, googleClientId, redirectAfterAuth]);

  const handleGoogleSignIn = () => {
    if (!googleClientId) {
      toast.warning("Google login is not configured. Add VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.");
      return;
    }

    const state = createGoogleNonce();
    const nonce = createGoogleNonce();
    const redirectUri = `${window.location.origin}/login`;
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    window.sessionStorage.setItem("flighthub_google_oauth_state", state);
    authUrl.searchParams.set("client_id", googleClientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "id_token");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);
    authUrl.searchParams.set("prompt", "select_account");

    window.location.assign(authUrl.toString());
  };

  const handleFacebookSignIn = async () => {
    if (!facebookAppId) {
      toast.warning("Facebook login is not configured. Add VITE_FACEBOOK_APP_ID, FACEBOOK_APP_ID, and FACEBOOK_APP_SECRET.");
      return;
    }

    if (!window.FB) {
      toast.warning("Facebook Login is still loading. Please try again.");
      return;
    }

    try {
      setFacebookLoading(true);
      const response = await new Promise((resolve) => {
        window.FB.login(resolve, { scope: "public_profile,email", return_scopes: true });
      });
      const accessToken = response?.authResponse?.accessToken;

      if (!accessToken) {
        toast.error("Facebook did not return a login credential");
        return;
      }

      const authResponse = await dispatch(facebookLogin({
        accessToken,
        rememberMe: true,
      })).unwrap();
      redirectAfterAuth(authResponse);
    } catch (err) {
      console.error("Facebook sign-in failed:", err);
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className={`space-y-5 ${loading && !googleLoading && !facebookLoading ? 'opacity-70 pointer-events-none' : ''}`}>

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
              placeholder="you@example.com"
              type="email"
              className="h-12 rounded-xl px-4 focus:border-primary focus:ring-primary/20"
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
              className="h-12 rounded-xl px-4 focus:border-primary focus:ring-primary/20"
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
            className="group h-12 w-full rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
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
          <div className="relative py-1 text-center text-sm text-muted-foreground">
            <span className="relative z-10 bg-background px-3 dark:bg-slate-950">Or continue with</span>
            <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
          </div>

          {/* Social */}
          <div className="grid gap-3">

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl bg-background/60 font-semibold"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleLogo />
              )}
              <span className="ml-2 text-sm">
                {googleClientId
                  ? googleLoading
                    ? "Signing in with Google..."
                    : "Continue with Google"
                  : "Google unavailable"}
              </span>
            </Button>

            {/* Facebook */}
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl bg-background/60 font-semibold"
              disabled={facebookLoading || (facebookAppId && !facebookReady)}
              onClick={handleFacebookSignIn}
            >
              {facebookLoading || (facebookAppId && !facebookReady) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FacebookLogo />
              )}
              <span className="ml-2 text-sm">
                {facebookAppId
                  ? facebookLoading
                    ? "Signing in with Facebook..."
                    : facebookReady
                      ? "Continue with Facebook"
                      : "Loading Facebook..."
                  : "Facebook unavailable"}
              </span>
            </Button>

          </div>

          {/* Register */}
          <div className="pt-2 text-center">
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

const FacebookLogo = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#1877F2" />
    <path fill="#fff" d="M15.5 12.7h-2.2V20h-3v-7.3H8.8v-2.6h1.5V8.4c0-1.2.6-3.2 3.2-3.2h2.4v2.6h-1.7c-.3 0-.8.2-.8.9v1.4h2.5l-.4 2.6Z" />
  </svg>
);

export default LoginForm;

import InputField from '@/components/InputField';
import PasswordField from '@/components/PasswordField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { login } from '@/Redux/auth/authThunk';
import { Form, Formik } from 'formik';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

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

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await dispatch(login(values)).unwrap();

      const role = result.user?.role;

      if (role === 'ROLE_AIRLINE_OWNER') {
        navigate('/airline/dashboard');
      } else if (role === 'ROLE_SYSTEM_ADMIN') {
        navigate('/super-admin/dashboard');
      } else {
        navigate('/traveler');
      }

    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className={`space-y-6 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>

          {/* Error */}
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <AlertDescription className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
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
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Lock className="w-4 h-4 mr-2 text-gray-400" />
              Password
            </label>
            <PasswordField
              name="password"
              placeholder="Enter your password"
              className="h-12 px-4 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl"
            />
          </div>

          {/* Remember */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                name="rememberMe"
                type="checkbox"
                checked={values.rememberMe}
                onChange={(event) => setFieldValue('rememberMe', event.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
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
          <div className="text-center text-sm text-gray-500">
            Or sign in using
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">

            {/* Google */}
            <Button variant="outline" className="h-11 rounded-xl">
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.23 3.6l6.9-6.9C35.8 2.4 30.3 0 24 0 14.6 0 6.4 5.4 2.6 13.3l8.1 6.3C12.5 13.4 17.8 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.7-.2-3.3-.5-4.8H24v9.1h12.7c-.5 2.7-2 5-4.2 6.5l6.5 5c3.8-3.5 6-8.7 6-15.8z"/>
                <path fill="#FBBC05" d="M10.7 28.6c-.6-1.8-1-3.7-1-5.6s.4-3.8 1-5.6l-8.1-6.3C.9 14.7 0 18.3 0 23s.9 8.3 2.6 11.9l8.1-6.3z"/>
                <path fill="#34A853" d="M24 46c6.3 0 11.6-2.1 15.5-5.7l-6.5-5c-1.8 1.2-4.1 2-7 2-6.2 0-11.5-3.9-13.3-9.1l-8.1 6.3C6.4 40.6 14.6 46 24 46z"/>
              </svg>
              <span className="ml-2 text-sm">Google</span>
            </Button>

            {/* Facebook */}
            <Button variant="outline" className="h-11 rounded-xl hover:shadow-md transition-all">
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="24" fill="#1877F2"/>
                <path
                  fill="#fff"
                  d="M29 15h-3c-2.2 0-4 1.8-4 4v3h-3v4h3v10h4V26h3l1-4h-4v-2c0-.6.4-1 1-1h3v-4z"
                />
              </svg>
              <span className="ml-2 text-sm">Facebook</span>
            </Button>

          </div>

          {/* Register */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
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

export default LoginForm;

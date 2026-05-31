import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock, Mail, Phone, UserRound } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import InputField from '../../components/InputField';
import PasswordField from '../../components/PasswordField';
import { signup } from '../../Redux/auth/authThunk';

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be 100 characters or less'),

  email: Yup.string()
    .trim()
    .lowercase()
    .required('Email is required')
    .email('Please enter a valid email address'),

  phone: Yup.string()
    .trim()
    .required('Phone number is required')
    .matches(/^(\+84|0)[0-9]{9}$/, 'Use a valid Vietnam phone number, e.g. 0912345678 or +84912345678'),

  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be 64 characters or less')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Password must contain uppercase, lowercase, and number'),

  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),

  termsAccepted: Yup.boolean()
    .oneOf([true], 'You must agree before creating an account'),
});

const initialValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false,
};

const normalizePhone = (phone) => phone.replace(/\s+/g, '');

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: normalizePhone(values.phone),
        password: values.password,
        role: 'ROLE_CUSTOMER',
      };

      const result = await dispatch(signup(payload)).unwrap();
      const role = result.user?.role;

      if (role === 'ROLE_AIRLINE_OWNER') {
        navigate('/airline/dashboard');
      } else if (role === 'ROLE_SYSTEM_ADMIN') {
        navigate('/super-admin/dashboard');
      } else {
        navigate('/traveler');
      }
    } catch (err) {
      console.error('Registration failed:', err);
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
      {({ isSubmitting, values, errors, touched, setFieldValue }) => (
        <Form className={`space-y-5 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <UserRound className="w-4 h-4 mr-2 text-gray-400" />
                Full name
              </label>
              <InputField
                name="fullName"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                Email address
              </label>
              <InputField
                name="email"
                placeholder="Enter your email"
                type="email"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                Phone number
              </label>
              <InputField
                name="phone"
                placeholder="0912345678"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-gray-400" />
                Password
              </label>
              <PasswordField
                name="password"
                placeholder="Create password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-gray-400" />
                Confirm password
              </label>
              <PasswordField
                name="confirmPassword"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-700" />
              <div>
                <p className="font-semibold">Customer account</p>
                <p className="mt-1 text-blue-800">
                  Airline and admin access are granted through the onboarding and approval workflow, not public signup.
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3">
            <input
              name="termsAccepted"
              type="checkbox"
              checked={values.termsAccepted}
              onChange={(event) => setFieldValue('termsAccepted', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600">
              I agree to create a FlightHub customer account and accept the platform security requirements.
              {touched.termsAccepted && errors.termsAccepted && (
                <span className="mt-1 block text-red-600">{errors.termsAccepted}</span>
              )}
            </span>
          </label>

          <Button
            type="submit"
            className="w-full font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default Register;

import { useCallback, useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, Lock, Loader2, Eye, EyeOff, CheckCircle, AlertCircle, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { signup } from '@/Redux/auth/authThunk';
import { getUserProfile } from '@/Redux/user/userThunks';

  const validationSchema = Yup.object({
    fullName: Yup.string()
      .required('Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(/^\+?[-\d\s()]+$/, 'Invalid phone number format'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    confirmPassword: Yup.string()
      .required('Please confirm your password')
      .oneOf([Yup.ref('password')], 'Passwords must match')
  });
const OwnerDetailsStep = ({ data, onDataChange, onNext }) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);



  const initialValues = {
    fullName: data?.fullName || '',
    email: data?.email || '',
    phone: data?.phone || '',
    password: data?.password || '',
    confirmPassword: data?.confirmPassword || ''
  };

  const handleSubmit = async (values, { setFieldError }) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Dispatch signup thunk
      const signupResult = await dispatch(signup({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: 'ROLE_AIRLINE_OWNER'
      })).unwrap();

      if (!signupResult.accessToken) {
        throw new Error('Signup failed. Please try again.');
      }

      // Fetch user profile after storing tokens
      const profileResult = await dispatch(getUserProfile()).unwrap();

      onDataChange({
        ...values,
        userId: profileResult?.id,
        accessToken: signupResult.accessToken
      });

      // Proceed to next step
      onNext();
    } catch (error) {
      setIsSubmitting(false);
      const message = String(error || 'An error occurred during registration. Please try again.');

      if (message.includes('already registered') || message.includes('email already exists')) {
        setFieldError('email', 'This email is already registered');
      } else {
        setSubmitError(message);
      }
    }
  };

  const fetchUserProfile = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      const response = await dispatch(getUserProfile()).unwrap();
      if (response && response.id) {
        onDataChange({
          fullName: response.fullName || response.name || data?.fullName || '',
          email: response.email || data?.email || '',
          phone: response.phone || data?.phone || '',
          userId: response.id,
          accessToken
        });
      }
    }
  }, [data?.email, data?.fullName, data?.phone, dispatch, onDataChange]);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && !data?.userId) {
      fetchUserProfile();
    }
  }, [data?.userId, fetchUserProfile]);

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^\w\s]/.test(password)) strength += 1;
    return strength;
  };

  const FormField = ({ name, label, type = 'text', icon: Icon, isPassword = false, ...props }) => (
    <div className="space-y-2">
      <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        {Icon && <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
        {label}
      </label>
      <Field name={name}>
        {({ field, meta }) => (
          <div className="relative">
            <Input
              {...field}
              {...props}
              id={name}
              type={isPassword ? (name === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')) : type}
              className={`h-12 w-full rounded-lg bg-white/90 pr-10 text-slate-950 shadow-sm backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:shadow-md focus:shadow-lg dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-500 ${
                meta.touched && meta.error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:focus:ring-red-500/20'
                  : meta.touched && !meta.error
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20 dark:focus:ring-green-500/20'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'
              }`}
              onChange={(e) => {
                field.onChange(e);
                if (name === 'password') {
                  setPasswordStrength(calculatePasswordStrength(e.target.value));
                }
              }}
            />

            {/* Password visibility toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => name === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
              >
                {(name === 'password' ? showPassword : showConfirmPassword) ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Validation icons */}
            {meta.touched && !isPassword && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {meta.error ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            )}
          </div>
        )}
      </Field>

      <ErrorMessage name={name} component="div" className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" />

      {name === 'password' && passwordStrength > 0 && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Password strength: {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Fair' : passwordStrength <= 4 ? 'Good' : 'Strong'}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 sm:h-16 sm:w-16">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="mb-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
            Create Airline Administrator
          </h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-lg">
            Securely create an administrator account to manage your airline.
          </p>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isValid }) => {
          return (
            <Form className="space-y-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                <FormField
                  name="fullName"
                  label="Full Name"
                  placeholder="Enter your full name"
                  icon={User}
                />

                <FormField
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="admin@yourairline.com"
                  icon={Mail}
                />
              </div>

              <FormField
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number (e.g., +1 234 567 8900)"
                icon={Phone}
              />

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                <FormField
                  name="password"
                  label="Password"
                  placeholder="Create a secure password"
                  icon={Lock}
                  isPassword={true}
                />

                <FormField
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  icon={Lock}
                  isPassword={true}
                />
              </div>

              {/* Security Requirements */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/30 dark:bg-blue-500/10">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Security Requirements
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-200">
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          passwordStrength >= 1 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}></div>
                        <span>At least 8 characters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          passwordStrength >= 2 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}></div>
                        <span>Contains lowercase letters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          passwordStrength >= 3 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}></div>
                        <span>Contains uppercase letters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          passwordStrength >= 4 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}></div>
                        <span>Contains numbers</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
                  <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
                </div>
              )}

              <div className="pt-2 sm:pt-4">
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="group h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-white shadow-xl shadow-blue-950/15 transition-all duration-300 hover:scale-[1.01] hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 dark:shadow-black/30 sm:h-14 sm:text-lg"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Create Admin & Continue
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-slate-200 pt-5 text-center dark:border-white/10">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="inline-flex items-center font-semibold text-blue-600 transition-all duration-200 hover:text-blue-700 hover:underline dark:text-blue-300 dark:hover:text-blue-200"
                    onClick={() => {
                      window.location.href = '/login';
                    }}
                  >
                    Login here
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default OwnerDetailsStep;

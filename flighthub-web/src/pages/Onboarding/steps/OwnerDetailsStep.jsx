import { useCallback, useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, Loader2, CheckCircle, AlertCircle, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { getUserProfile } from '@/Redux/user/userThunks';
import { getAccessToken } from '@/utils/authStorage';

  const validationSchema = Yup.object({
    fullName: Yup.string()
      .required('Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    phone: Yup.string()
      .required('Phone number is required')
      .matches(/^\+?[-\d\s()]+$/, 'Invalid phone number format')
  });
const OwnerDetailsStep = ({ data, onDataChange, onNext }) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');



  const initialValues = {
    fullName: data?.fullName || '',
    email: data?.email || '',
    phone: data?.phone || ''
  };

  const handleSubmit = async (values, { setFieldError }) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('Airline owner accounts must be created by a system admin first. Please sign in with the owner account before continuing onboarding.');
      }

      const profileResult = await dispatch(getUserProfile()).unwrap();
      if (profileResult?.role !== 'ROLE_AIRLINE_OWNER') {
        throw new Error('Only airline owner accounts can continue airline onboarding.');
      }

      onDataChange({
        ...values,
        fullName: profileResult.fullName || values.fullName,
        email: profileResult.email || values.email,
        phone: profileResult.phone || values.phone,
        userId: profileResult.id,
        accessToken
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
    const accessToken = getAccessToken();
    if (accessToken) {
      const response = await dispatch(getUserProfile()).unwrap();
      if (response?.id && response.role === 'ROLE_AIRLINE_OWNER') {
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
    const accessToken = getAccessToken();
    if (accessToken && !data?.userId) {
      fetchUserProfile();
    }
  }, [data?.userId, fetchUserProfile]);

  const FormField = ({ name, label, type = 'text', icon: Icon, ...props }) => (
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
              type={type}
              className={`h-12 w-full rounded-lg bg-white/90 pr-10 text-slate-950 shadow-sm backdrop-blur-sm transition-all duration-300 placeholder:text-slate-400 hover:shadow-md focus:shadow-lg dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-500 ${
                meta.touched && meta.error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:focus:ring-red-500/20'
                  : meta.touched && !meta.error
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20 dark:focus:ring-green-500/20'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'
              }`}
            />

            {/* Validation icons */}
            {meta.touched && (
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
            Verify Airline Owner
          </h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-lg">
            Continue with an airline owner account created by a system admin.
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

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/30 dark:bg-blue-500/10">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Account Requirement
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      Public registration creates customer accounts only. Airline owner accounts are created in Super Admin User Management, then used here to complete airline onboarding.
                    </p>
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
                      Verifying Owner Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Verify Owner & Continue
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-slate-200 pt-5 text-center dark:border-white/10">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Need to switch account?{' '}
                  <button
                    type="button"
                    className="inline-flex items-center font-semibold text-blue-600 transition-all duration-200 hover:text-blue-700 hover:underline dark:text-blue-300 dark:hover:text-blue-200"
                    onClick={() => {
                      window.location.href = '/login';
                    }}
                  >
                    Sign in
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  If you need owner access, ask a system admin to create an Airline Owner account.
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

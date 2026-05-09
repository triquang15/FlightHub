import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import InputField from '../../components/InputField';
import PasswordField from '../../components/PasswordField';
import { signup } from '../../Redux/auth/authThunk';
import { Loader2 } from 'lucide-react';

// Validation schema
const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .required('Full name is required')
    .min(3, 'Full name must be at least 3 characters'),

  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address'),

  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/,
      'Password must include letters, numbers, and special characters'
    ),

  phone: Yup.string()
    .required('Phone number is required')
    .matches(/^\d{10,15}$/, 'Phone number must be between 10 and 15 digits'),
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);

  const initialValues = {
    fullName: '',
    email: '',
    password: '',
    phone: '',
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = { ...values };

      const result = await dispatch(signup(payload)).unwrap();

      const responseUser = result.user;

      // Redirect theo role
      if (responseUser?.role === 'ROLE_CUSTOMER') {
        navigate('/traveler');
      } else if (responseUser?.role === 'ROLE_AIRLINE_OWNER') {
        navigate('/airline/dashboard');
      } else if (responseUser?.role === 'ROLE_SYSTEM_ADMIN') {
        navigate('/super-admin/dashboard');
      } else {
        navigate('/');
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
      {({ isSubmitting }) => (
        <Form
          className={`space-y-4 ${
            loading ? 'opacity-70 pointer-events-none' : ''
          }`}
        >
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100 animate-fade-in">
              {error}
            </div>
          )}

          <InputField
            label="Full Name"
            name="fullName"
            placeholder="Enter your full name"
            autoFocus
          />

          <InputField
            label="Email Address"
            name="email"
            placeholder="Enter your email"
            type="email"
          />

          <PasswordField
            label="Password"
            name="password"
            placeholder="Create a password"
          />

          <InputField
            label="Phone Number"
            name="phone"
            placeholder="Enter your phone number"
            type="tel"
          />

          <Button
            type="submit"
            className="w-full font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
            disabled={isSubmitting || loading}
          >
            {(isSubmitting || loading) ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default Register;
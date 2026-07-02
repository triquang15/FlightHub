import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Phone,
  Clock,
  ArrowLeft,
  ArrowRight,
  HeadphonesIcon,
  Users,
  Sparkles,
  CheckCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const SupportContactStep = ({ data, onDataChange, onNext, onPrevious }) => {
  const validationSchema = Yup.object({
    supportEmail: Yup.string()
      .email('Invalid email format')
      .nullable(),
    supportPhone: Yup.string()
      .matches(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
      .nullable(),
    supportHours: Yup.string()
      .nullable()
  }).test('support-contact-required', 'Provide at least one support email or phone number', function (values) {
    if (values?.supportEmail || values?.supportPhone) return true;

    return this.createError({
      path: 'supportEmail',
      message: 'Provide at least one support email or phone number'
    });
  });

  const initialValues = {
    supportEmail: data?.supportEmail || '',
    supportPhone: data?.supportPhone || '',
    supportHours: data?.supportHours || '',
    additionalNotes: data?.additionalNotes || ''
  };

  const handleSubmit = (values) => {
    onDataChange(values);
    onNext();
  };

  const supportHoursExamples = [
    '24/7 Support',
    'Monday - Friday: 9:00 AM - 6:00 PM (UTC)',
    'Business Hours: 8:00 AM - 8:00 PM EST',
    'Mon-Fri: 9-17, Sat-Sun: 10-14 (GMT)',
    'Available during flight operations only'
  ];

  const inputStateClass = (meta, value) => {
    if (meta?.touched && meta?.error) {
      return 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:focus:ring-red-500/20';
    }

    if (meta?.touched && value) {
      return 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-emerald-500 dark:focus:ring-emerald-500/20';
    }

    return 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/20';
  };

  const baseInputClass =
    'h-12 rounded-lg bg-white/90 text-slate-950 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:shadow-md focus:shadow-lg dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-500';

  const FormField = ({ name, label, children, helpText, optional = true, ...props }) => (
    <div className="space-y-2">
      <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        {props.icon && <props.icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-slate-400 dark:text-slate-500">(Optional)</span>}
      </label>
      {children}
      <ErrorMessage name={name} component="div" className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" />
      {helpText && (
        <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{helpText}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-emerald-500/20 sm:h-16 sm:w-16">
          <Users className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="mb-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
            Customer Support & Contact
          </h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-lg">
            Provide preferred contact channels so customers and partners can reach you.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
          <CheckCircle className="w-4 h-4" />
          <span>Email or phone is required for operational review</span>
        </div>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ setFieldValue, isValid }) => {
          return (
            <Form className="space-y-5">
              {/* Contact Information Section */}
              <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-950 dark:text-white">Contact Channels</h4>
                    <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Primary ways customers can reach your support team</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* Support Email */}
                  <FormField
                    name="supportEmail"
                    label="Support Email"
                    icon={Mail}
                    helpText="Primary email address for customer inquiries"
                  >
                    <Field name="supportEmail">
                      {({ field, meta }) => (
                        <div className="relative">
                          <Input
                            {...field}
                            id="supportEmail"
                            type="email"
                            placeholder="support@yourairline.com"
                            className={`${baseInputClass} pr-10 ${inputStateClass(meta, field.value)}`}
                          />
                          {meta.touched && field.value && (
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
                  </FormField>

                  {/* Support Phone */}
                  <FormField
                    name="supportPhone"
                    label="Support Phone"
                    icon={Phone}
                    helpText="Phone number for urgent customer support"
                  >
                    <Field name="supportPhone">
                      {({ field, meta }) => (
                        <div className="relative">
                          <Input
                            {...field}
                            id="supportPhone"
                            type="tel"
                            placeholder="+1 800 123 4567"
                            className={`${baseInputClass} pr-10 ${inputStateClass(meta, field.value)}`}
                          />
                          {meta.touched && field.value && (
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
                  </FormField>
                </div>
              </section>

              {/* Support Hours Section */}
              <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-950 dark:text-white">Availability Schedule</h4>
                    <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">When customers can expect support response</p>
                  </div>
                </div>

                <FormField
                  name="supportHours"
                  label="Support Hours"
                  icon={Clock}
                  helpText="Operating hours for customer support team"
                >
                  <Field name="supportHours">
                    {({ field }) => (
                      <div className="space-y-4">
                        <Input
                          {...field}
                          id="supportHours"
                          placeholder="e.g., Monday - Friday: 9:00 AM - 6:00 PM (UTC)"
                          className={baseInputClass}
                        />
                        <div className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/50">
                          <p className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-200">Quick Templates</p>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            {supportHoursExamples.map((example, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setFieldValue('supportHours', example)}
                                className="rounded-lg border border-transparent p-2 text-left text-sm leading-5 text-blue-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-300 dark:hover:border-blue-900/60 dark:hover:bg-blue-950/30 dark:hover:text-blue-200"
                              >
                                {example}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Field>
                </FormField>
              </section>

              {/* Additional Notes */}
              <FormField name="additionalNotes" label="Additional Notes" icon={HeadphonesIcon} optional>
                <Field name="additionalNotes">
                  {({ field }) => (
                    <Textarea
                      {...field}
                      id="additionalNotes"
                      placeholder="Any additional information about your support services, special procedures, or contact preferences..."
                      rows={4}
                      className="min-h-28 rounded-lg border-slate-200 bg-white/90 text-slate-950 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:shadow-md focus:border-blue-500 focus:shadow-lg focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                    />
                  )}
                </Field>
              </FormField>

              {/* Info Box */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="flex items-start gap-3">
                  <HeadphonesIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Why provide support information?
                    </h4>
                    <div className="space-y-1 text-sm leading-6 text-blue-700 dark:text-blue-200">
                      <p>Help customers reach you directly for urgent matters.</p>
                      <p>Improve customer trust and coordination with travel agents.</p>
                      <p>Provide transparent service availability for operational review.</p>
                    </div>
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">
                      You can update this information anytime from your dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-white/10 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPrevious}
                  className="h-11 rounded-lg px-5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous Step
                </Button>

                <Button
                  type="submit"
                  disabled={!isValid}
                  className="h-11 rounded-lg px-5"
                >
                  Review Submission
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default SupportContactStep;

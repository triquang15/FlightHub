import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  User,
  Plane,
  Globe,
  HeadphonesIcon,
  Edit,
  ArrowLeft,
  Loader2,
  Zap,
  Shield,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { createAirline } from '@/Redux/airline/airlineThunks';

const ReviewConfirmationStep = ({ formData, onEdit, onPrevious, onComplete }) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const website = formData.airline.website?.trim()
        ? /^https?:\/\//i.test(formData.airline.website.trim())
          ? formData.airline.website.trim()
          : `https://${formData.airline.website.trim()}`
        : null;

      const airlineData={
        iataCode: formData.airline.iataCode,
        icaoCode: formData.airline.icaoCode,
        name: formData.airline.airlineName,
        alias: formData.airline.alias || null,
        logoUrl: formData.airline.logoUrl || null,
        website,
        alliance: formData.airline.alliance || null,
        baggagePolicy: formData.airline.baggagePolicy || null,
        headquartersCityId: formData.airline.headquartersCity,
        supportEmail: formData.support.supportEmail || null,
        supportPhone: formData.support.supportPhone || null,
        supportHours: formData.support.supportHours || null,
        additionalNotes: formData.support.additionalNotes || null
      }

      // Dispatch createAirline thunk
      await dispatch(createAirline(airlineData)).unwrap();

      // Success - trigger completion
      onComplete();
    } catch (error) {
      setIsSubmitting(false);
      const message = String(error || '');
      let userMessage;

      if (message.includes('session has expired') || message.includes('Unauthorized')) {
        userMessage = 'Your session has expired. Please refresh the page and try again.';
      } else if (message.includes('already exists') || message.includes('IATA') || message.includes('ICAO')) {
        userMessage = message;
      } else {
        userMessage = message || 'An error occurred while creating your airline. Please try again.';
      }

      setSubmitError(userMessage);
      toast.error(userMessage);
    }
  };

  const DataCard = ({ title, icon: Icon, children, onEdit, editLabel = "Edit", gradient = "from-blue-500 to-purple-600" }) => (
    <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white/90 text-slate-950 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:text-white">
      <div className={`h-1 bg-gradient-to-r ${gradient}`}></div>
      <CardHeader className="border-b border-slate-200 pb-4 dark:border-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-sm`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 dark:text-white">{title}</h4>
              <div className="mt-1 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Ready for review</span>
              </div>
            </div>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-9 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <Edit className="h-4 w-4" />
            {editLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );

  const DataRow = ({ label, value, className = "" }) => (
    <div className={`flex flex-col gap-1 rounded-lg border-b border-slate-200 px-2 py-3 last:border-b-0 hover:bg-slate-50/70 dark:border-white/10 dark:hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      <span className="text-sm font-medium text-slate-950 dark:text-white">{value || <span className="italic text-slate-400 dark:text-slate-500">Not provided</span>}</span>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20 sm:h-16 sm:w-16">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="mb-2 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
            Final Review & Submission
          </h3>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-lg">
            Confirm the details before sending this airline profile to Super Admin for approval.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <Shield className="h-4 w-4" />
          <span>Submission status will be pending approval</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Owner Details */}
        <DataCard
          title="Administrator Account"
          icon={User}
          onEdit={() => onEdit(1)}
          gradient="from-blue-500 to-cyan-600"
        >
          <div className="space-y-0 rounded-lg bg-slate-50/80 p-3 dark:bg-slate-950/50">
            <DataRow label="Full Name" value={formData.owner.fullName} />
            <DataRow label="Email" value={formData.owner.email} />
            <DataRow label="Phone" value={formData.owner.phone} />
          </div>
        </DataCard>

        {/* Airline Details */}
        <DataCard
          title="Airline Profile"
          icon={Plane}
          onEdit={() => onEdit(2)}
          gradient="from-purple-500 to-pink-600"
        >
          <div className="space-y-0 rounded-lg bg-slate-50/80 p-3 dark:bg-slate-950/50">
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">IATA Code</div>
                {formData.airline.iataCode ? (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 px-3 py-1 font-mono text-lg text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
                    {formData.airline.iataCode}
                  </Badge>
                ) : (
                  <span className="italic text-slate-400 dark:text-slate-500">Not provided</span>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-1 text-sm text-slate-500 dark:text-slate-400">ICAO Code</div>
                {formData.airline.icaoCode ? (
                  <Badge variant="outline" className="border-purple-200 bg-purple-50 px-3 py-1 font-mono text-lg text-purple-800 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-200">
                    {formData.airline.icaoCode}
                  </Badge>
                ) : (
                  <span className="italic text-slate-400 dark:text-slate-500">Not provided</span>
                )}
              </div>
            </div>

            <DataRow label="Airline Name" value={formData.airline.airlineName} />
            <DataRow label="Alias" value={formData.airline.alias} />
            {/* Country removed (not used by backend) */}
            <DataRow label="Headquarters" value={formData.airline.headquartersCity} />
            <DataRow
              label="Submission Status"
              value={(
                <Badge
                  variant="secondary"
                  className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                >
                  Pending super-admin approval
                </Badge>
              )}
            />
            <DataRow label="Website" value={formData.airline.website} />
            <DataRow label="Alliance" value={formData.airline.alliance} />

            {formData.airline.logoUrl && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex items-center gap-4">
                  <img
                    src={formData.airline.logoUrl}
                    alt="Airline logo"
                    className="h-20 w-20 rounded-lg border border-slate-200 bg-white object-contain p-2 shadow-sm dark:border-white/10"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                    <div className="font-semibold text-slate-950 dark:text-white">Brand Logo</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Ready for display</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DataCard>

        {/* Support & Contact */}
        <DataCard
          title="Customer Support"
          icon={HeadphonesIcon}
          onEdit={() => onEdit(3)}
          gradient="from-green-500 to-emerald-600"
        >
          <div className="space-y-0 rounded-lg bg-slate-50/80 p-3 dark:bg-slate-950/50">
            <DataRow label="Support Email" value={formData.support.supportEmail} />
            <DataRow label="Support Phone" value={formData.support.supportPhone} />
            <DataRow label="Support Hours" value={formData.support.supportHours} />
            {formData.support.additionalNotes && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-2 font-semibold text-slate-950 dark:text-white">Additional Notes</div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{formData.support.additionalNotes}</p>
              </div>
            )}
          </div>
        </DataCard>
      </div>

      {/* Terms and Conditions */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <h4 className="flex items-center gap-2 text-base font-semibold text-amber-950 dark:text-amber-100 sm:text-lg">
              Terms & Conditions
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </h4>
            <div className="space-y-3 text-sm leading-6 text-amber-900 dark:text-amber-100">
              <p className="font-medium">By submitting this registration, you agree to:</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span>Provide accurate and up-to-date information</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span>Comply with all GDS platform policies</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span>Maintain valid operating certificates</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span>Pay applicable platform service fees</span>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-white/70 p-3 dark:border-amber-900/60 dark:bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  <span className="font-medium text-slate-950 dark:text-white">Global Compliance</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Your registration will be processed according to international aviation standards and GDPR requirements.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
          <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-white/10 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
          className="h-11 rounded-lg px-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous Step
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-11 rounded-lg px-5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit for Review
              <Sparkles className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewConfirmationStep;

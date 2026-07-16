import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronDown, ChevronUp, Mail, AlertCircle, ChevronDownIcon, CheckCircle2, Phone, ShieldCheck, UserRoundCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSelector } from 'react-redux';
import api from '@/utils/api';

const createPassenger = (index) => ({
  id: index,
  type: 'Adult',
  title: '',
  firstName: '',
  lastName: '',
  gender: '',
  dob: '',
  passportNumber: '',
  passportExpiry: '',
  nationality: ''
});

const COUNTRY_CODES = [
  { value: '+1', label: '+1 US/CA' },
  { value: '+84', label: '+84 VN' },
  { value: '+44', label: '+44 UK' },
  { value: '+65', label: '+65 SG' },
  { value: '+81', label: '+81 JP' },
  { value: '+82', label: '+82 KR' },
  { value: '+91', label: '+91 IN' },
  { value: '+971', label: '+971 AE' },
];

const inputBaseClass =
  'w-full rounded-md border bg-white px-4 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 dark:bg-slate-900 dark:text-white';
const validInputClass =
  'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10';
const invalidInputClass =
  '!border-rose-400 bg-rose-50/60 focus:!border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:!border-rose-400/60 dark:bg-rose-500/10';
const fieldErrorText = 'mt-1 text-xs font-medium text-rose-600 dark:text-rose-300';

const getEnvelopeData = (response) => response?.data?.data ?? response?.data;

const normalizeGender = (gender) => {
  const normalized = String(gender || '').toUpperCase();
  if (normalized === 'MALE') return 'Male';
  if (normalized === 'FEMALE') return 'Female';
  if (normalized === 'OTHER') return 'Other';
  return '';
};

const inferTitle = (gender) => {
  const normalized = normalizeGender(gender);
  if (normalized === 'Male') return 'Mr';
  if (normalized === 'Female') return 'Ms';
  return '';
};

const savedPassengerLabel = (passenger) => {
  const name = [passenger.firstName, passenger.lastName].filter(Boolean).join(' ') || passenger.fullName || 'Saved traveler';
  const document = passenger.passportNumber ? ` · ${passenger.passportNumber}` : '';
  return `${name}${document}`;
};

const TravellerDetailsForm = ({ passengerCount = 1, onTravellerDataChange, validationAttempted = false }) => {
  const [expandedPassenger, setExpandedPassenger] = useState(0);
  const [dobPopoverOpen, setDobPopoverOpen] = useState({});
  const {userProfile}=useSelector(state=>state.user);
  const [savedPassengers, setSavedPassengers] = useState([]);
  const [savedPassengersLoading, setSavedPassengersLoading] = useState(false);
  const [travellerData, setTravellerData] = useState(
    Array.from({ length: passengerCount }, (_, i) => createPassenger(i))
  );

  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    countryCode: '+1'
  });


  useEffect(()=>{
    if(userProfile){
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContactInfo((current) => ({
        ...current,
        email: userProfile.email||'',
        phone: userProfile.phone || current.phone,
      }));
    }
  },[userProfile])

  useEffect(() => {
    let cancelled = false;

    const loadSavedPassengers = async () => {
      try {
        setSavedPassengersLoading(true);
        const response = await api.get('/api/passengers/me');
        const passengers = getEnvelopeData(response);
        if (!cancelled) {
          setSavedPassengers(Array.isArray(passengers) ? passengers : []);
        }
      } catch {
        if (!cancelled) {
          setSavedPassengers([]);
        }
      } finally {
        if (!cancelled) {
          setSavedPassengersLoading(false);
        }
      }
    };

    loadSavedPassengers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTravellerData((current) => {
      return Array.from(
        { length: passengerCount },
        (_, index) => current[index] || createPassenger(index),
      );
    });
  }, [passengerCount]);

  useEffect(() => {
    onTravellerDataChange?.({ passengers: travellerData, contactInfo });
  }, [travellerData, contactInfo, onTravellerDataChange]);

  const handleInputChange = (passengerIndex, field, value) => {
    const updatedData = [...travellerData];
    updatedData[passengerIndex] = {
      ...updatedData[passengerIndex],
      [field]: value
    };
    setTravellerData(updatedData);
  };

  const applySavedPassenger = (passengerIndex, savedPassengerId) => {
    const savedPassenger = savedPassengers.find((passenger) => String(passenger.id) === String(savedPassengerId));
    if (!savedPassenger) return;

    setTravellerData((current) => {
      const updatedData = [...current];
      const existingPassenger = updatedData[passengerIndex] || createPassenger(passengerIndex);
      updatedData[passengerIndex] = {
        ...existingPassenger,
        title: existingPassenger.title || inferTitle(savedPassenger.gender),
        firstName: savedPassenger.firstName || '',
        lastName: savedPassenger.lastName || '',
        gender: normalizeGender(savedPassenger.gender),
        dob: savedPassenger.dateOfBirth || '',
        passportNumber: savedPassenger.passportNumber || '',
        nationality: savedPassenger.nationality || existingPassenger.nationality || '',
        frequentFlyerNumber: savedPassenger.frequentFlyerNumber || '',
        email: savedPassenger.email || existingPassenger.email || '',
        phone: savedPassenger.phone || existingPassenger.phone || '',
      };
      return updatedData;
    });

    if (!contactInfo.email && savedPassenger.email) {
      setContactInfo((current) => ({ ...current, email: savedPassenger.email }));
    }
    if (!contactInfo.phone && savedPassenger.phone) {
      setContactInfo((current) => ({ ...current, phone: savedPassenger.phone.replace(/^\+\d{1,3}/, '') }));
    }
  };

  const handleContactInfoChange = (field, value) => {
    const updatedContactInfo = {
      ...contactInfo,
      [field]: value
    };
    setContactInfo(updatedContactInfo);
  };

  const togglePassenger = (index) => {
    setExpandedPassenger(expandedPassenger === index ? -1 : index);
  };

  const isPassengerComplete = (passenger) => {
    const requiredFields = ['title', 'firstName', 'lastName', 'gender', 'dob'];
    return requiredFields.every(field => passenger[field]);
  };

  const completedPassengers = travellerData.filter(isPassengerComplete).length;
  const isContactComplete = Boolean(contactInfo.email && contactInfo.phone);
  const isMissing = (value) => validationAttempted && !value;
  const inputClass = (value) => `${inputBaseClass} ${isMissing(value) ? invalidInputClass : validInputClass}`;

  useEffect(() => {
    if (!validationAttempted) return;

    const firstIncompleteIndex = travellerData.findIndex((passenger) => !isPassengerComplete(passenger));
    if (firstIncompleteIndex >= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedPassenger(firstIncompleteIndex);
    }
  }, [travellerData, validationAttempted]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20"
    >
      <div className="border-b border-slate-200 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-slate-950/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Passenger information</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Enter each traveller exactly as shown on the ID used at the airport.
            </p>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm sm:text-right dark:border-white/10 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Completion</p>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            {completedPassengers}/{passengerCount} passengers · {isContactComplete ? 'contact ready' : 'contact required'}
          </p>
        </div>
      </div>
      </div>

      <div className="m-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Review names before payment</p>
            <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-200">
              Airlines may deny boarding or charge correction fees when traveller names do not match official documents.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6">
        {travellerData.map((passenger, index) => {
          const isExpanded = expandedPassenger === index;
          const isComplete = isPassengerComplete(passenger);

          return (
            <div
              key={passenger.id}
              className={`overflow-hidden rounded-lg border transition-all ${
                isComplete
                  ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-400/30 dark:bg-emerald-500/10'
                  : validationAttempted
                  ? 'border-rose-300 bg-rose-50/40 dark:border-rose-400/30 dark:bg-rose-500/10'
                  : 'border-slate-200 dark:border-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => togglePassenger(index)}
                className="flex w-full items-center justify-between gap-4 bg-white p-4 text-left transition-colors hover:bg-slate-50 dark:bg-slate-900/70 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold ${
                    isComplete
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-950 dark:text-white">
                      Passenger {index + 1}
                      {isComplete && passenger.firstName && (
                        <span className="ml-2 text-slate-600 dark:text-slate-400">
                          - {passenger.title} {passenger.firstName} {passenger.lastName}
                        </span>
                      )}
                    </p>
                    {!isComplete && (
                      <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-300">Required: title, name, gender, date of birth</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isComplete && (
                    <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200 sm:inline-flex">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Complete
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/50 sm:p-6"
                >
                  <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    Travel document name
                  </div>
                  {(savedPassengersLoading || savedPassengers.length > 0) && (
                    <div className="mb-5 rounded-md border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                            <UserRoundCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-950 dark:text-white">Saved travelers</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Autofill this passenger from your previous bookings.
                            </p>
                          </div>
                        </div>
                        <Select
                          disabled={savedPassengersLoading || savedPassengers.length === 0}
                          onValueChange={(value) => applySavedPassenger(index, value)}
                        >
                          <SelectTrigger className="w-full rounded-md sm:w-72">
                            <SelectValue placeholder={savedPassengersLoading ? 'Loading travelers...' : 'Use saved traveler'} />
                          </SelectTrigger>
                          <SelectContent>
                            {savedPassengers.map((savedPassenger) => (
                              <SelectItem key={savedPassenger.id} value={String(savedPassenger.id)}>
                                {savedPassengerLabel(savedPassenger)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={passenger.title}
                        onValueChange={(value) => handleInputChange(index, 'title', value)}
                      >
                        <SelectTrigger className={`w-full rounded-md ${isMissing(passenger.title) ? '!border-rose-400 bg-rose-50/60 focus:ring-rose-500/20 dark:!border-rose-400/60 dark:bg-rose-500/10' : ''}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                          <SelectItem value="Miss">Miss</SelectItem>
                        </SelectContent>
                      </Select>
                      {isMissing(passenger.title) && (
                        <p className={fieldErrorText}>Select a title.</p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Given name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={passenger.firstName}
                        onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                        placeholder="e.g. Quang"
                        autoComplete="given-name"
                        className={inputClass(passenger.firstName)}
                      />
                      {isMissing(passenger.firstName) && (
                        <p className={fieldErrorText}>Enter given name.</p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Family name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={passenger.lastName}
                        onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                        placeholder="e.g. Nguyen"
                        autoComplete="family-name"
                        className={inputClass(passenger.lastName)}
                      />
                      {isMissing(passenger.lastName) && (
                        <p className={fieldErrorText}>Enter family name.</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={passenger.gender}
                        onValueChange={(value) => handleInputChange(index, 'gender', value)}
                      >
                        <SelectTrigger className={`w-full rounded-md ${isMissing(passenger.gender) ? '!border-rose-400 bg-rose-50/60 focus:ring-rose-500/20 dark:!border-rose-400/60 dark:bg-rose-500/10' : ''}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {isMissing(passenger.gender) && (
                        <p className={fieldErrorText}>Select gender.</p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Date of birth <span className="text-red-500">*</span>
                      </label>
                      <Popover
                        open={dobPopoverOpen[index]}
                        onOpenChange={(open) => setDobPopoverOpen(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between rounded-md font-normal ${isMissing(passenger.dob) ? '!border-rose-400 bg-rose-50/60 text-rose-900 focus:ring-rose-500/20 dark:!border-rose-400/60 dark:bg-rose-500/10 dark:text-rose-100' : ''}`}
                          >
                            {passenger.dob ? new Date(passenger.dob).toLocaleDateString() : "Select date"}
                            <ChevronDownIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={passenger.dob ? new Date(passenger.dob) : undefined}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              if (date) {
                                handleInputChange(index, 'dob', date.toISOString().split('T')[0]);
                                setDobPopoverOpen(prev => ({ ...prev, [index]: false }));
                              }
                            }}
                            fromYear={1940}
                            toYear={new Date().getFullYear()}
                            disabled={(date) => date > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      {isMissing(passenger.dob) && (
                        <p className={fieldErrorText}>Select date of birth.</p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={passenger.nationality}
                        onChange={(e) => handleInputChange(index, 'nationality', e.target.value)}
                        placeholder="Optional, e.g. Vietnam"
                        autoComplete="country-name"
                        className={`${inputBaseClass} ${validInputClass}`}
                      />
                    </div>
                  </div>

                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <div className="m-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950/40 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">Booking contact</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                We will send confirmation, schedule changes, and payment updates here.
              </p>
            </div>
          </div>
          <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
            isContactComplete
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200'
          }`}>
            {isContactComplete ? 'Ready' : 'Required'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={contactInfo.email}
              onChange={(e) => handleContactInfoChange('email', e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className={inputClass(contactInfo.email)}
            />
            {isMissing(contactInfo.email) && (
              <p className={fieldErrorText}>Enter contact email.</p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your e-ticket and receipt will be sent to this email.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mobile number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={contactInfo.countryCode}
                onChange={(e) => handleContactInfoChange('countryCode', e.target.value)}
                className={`w-32 rounded-md border bg-white px-2 py-2.5 text-slate-950 outline-none transition focus:ring-2 dark:bg-slate-900 dark:text-white ${
                  isMissing(contactInfo.phone)
                    ? '!border-rose-400 focus:!border-rose-500 focus:ring-rose-500/20 dark:!border-rose-400/60'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10'
                }`}
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleContactInfoChange('phone', e.target.value.replace(/\D/g, ''))}
                placeholder="Mobile number"
                autoComplete="tel-national"
                inputMode="tel"
                className={`min-w-0 flex-1 ${inputClass(contactInfo.phone)}`}
              />
            </div>
            {isMissing(contactInfo.phone) && (
              <p className={fieldErrorText}>Enter mobile number.</p>
            )}
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Phone className="h-3.5 w-3.5" />
              Used for urgent flight or payment notifications.
            </p>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default TravellerDetailsForm;

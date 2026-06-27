import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronDown, ChevronUp, Mail, Phone, AlertCircle, ChevronDownIcon } from 'lucide-react';
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

const TravellerDetailsForm = ({ passengerCount = 1, onTravellerDataChange }) => {
  const [expandedPassenger, setExpandedPassenger] = useState(0);
  const [dobPopoverOpen, setDobPopoverOpen] = useState({});
  const {userProfile}=useSelector(state=>state.user);
  const [travellerData, setTravellerData] = useState(
    Array.from({ length: passengerCount }, (_, i) => ({
      id: i,
      type: i === 0 ? 'Adult' : 'Adult',
      title: '',
      firstName: '',
      lastName: '',
      gender: '',
      dob: '',
      passportNumber: '',
      passportExpiry: '',
      nationality: 'Indian'
    }))
  );

  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    countryCode: '+91'
  });


  useEffect(()=>{
    if(userProfile){
      
      setContactInfo({
        email: userProfile.email||'',
        phone: userProfile.phone || '9870065904',
        countryCode: '+91'
      });
    }
  },[userProfile])

  const handleInputChange = (passengerIndex, field, value) => {
    const updatedData = [...travellerData];
    updatedData[passengerIndex] = {
      ...updatedData[passengerIndex],
      [field]: value
    };
    setTravellerData(updatedData);
    onTravellerDataChange?.({ passengers: updatedData, contactInfo });
  };

  const handleContactInfoChange = (field, value) => {
    const updatedContactInfo = {
      ...contactInfo,
      [field]: value
    };
    setContactInfo(updatedContactInfo);
    onTravellerDataChange?.({ passengers: travellerData, contactInfo: updatedContactInfo });
  };

  const togglePassenger = (index) => {
    setExpandedPassenger(expandedPassenger === index ? -1 : index);
  };

  const isPassengerComplete = (passenger) => {
    const requiredFields = ['title', 'firstName', 'lastName', 'gender', 'dob'];
    return requiredFields.every(field => passenger[field]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/20"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10">
          <User className="h-6 w-6 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Traveller Details</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Enter passenger information as per ID proof</p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
          <div>
            <p className="mb-1 text-sm font-medium text-amber-900 dark:text-amber-100">Important</p>
            <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-200">
              <li>Enter name as per your government approved ID proof</li>
              <li>Date of birth is required for passenger verification</li>
              <li>Passport details are mandatory for international flights</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Traveller Forms */}
      <div className="space-y-4">
        {travellerData.map((passenger, index) => {
          const isExpanded = expandedPassenger === index;
          const isComplete = isPassengerComplete(passenger);

          return (
            <div
              key={passenger.id}
              className={`border-2 rounded-xl overflow-hidden transition-all ${
                isComplete
                  ? 'border-green-200 dark:border-green-400/30'
                  : 'border-slate-200 dark:border-white/10'
              }`}
            >
              {/* Passenger Header */}
              <button
                onClick={() => togglePassenger(index)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isComplete
                      ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {passenger.type} {index + 1}
                      {isComplete && passenger.firstName && (
                        <span className="ml-2 text-slate-600 dark:text-slate-400">
                          - {passenger.title} {passenger.firstName} {passenger.lastName}
                        </span>
                      )}
                    </p>
                    {!isComplete && (
                      <p className="text-xs text-red-600 dark:text-red-300">Please fill required details</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isComplete && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-300">
                      Completed
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  )}
                </div>
              </button>

              {/* Passenger Form */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-950/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Title */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={passenger.title}
                        onValueChange={(value) => handleInputChange(index, 'title', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                          <SelectItem value="Miss">Miss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={passenger.firstName}
                        onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                        placeholder="Enter first name"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={passenger.lastName}
                        onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                        placeholder="Enter last name"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={passenger.gender}
                        onValueChange={(value) => handleInputChange(index, 'gender', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <Popover
                        open={dobPopoverOpen[index]}
                        onOpenChange={(open) => setDobPopoverOpen(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
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
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Nationality */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={passenger.nationality}
                        onChange={(e) => handleInputChange(index, 'nationality', e.target.value)}
                        placeholder="Enter nationality"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Information Section - Separate from passengers */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-950/40">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">Contact Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={contactInfo.email}
              onChange={(e) => handleContactInfoChange('email', e.target.value)}
              placeholder="Enter email address"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Booking confirmation will be sent here</p>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={contactInfo.countryCode}
                onChange={(e) => handleContactInfoChange('countryCode', e.target.value)}
                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-950 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                <option value="+91">+91</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
                <option value="+971">+971</option>
              </select>
              <input
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                placeholder="Enter mobile number"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Booking details will be sent via SMS</p>
          </div>
        </div>
      </div>

      {/* GST Details (Optional) */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Need GST Invoice?</p>
          </div>
          <button className="text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200">
            Add Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TravellerDetailsForm;

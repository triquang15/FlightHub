import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plane, Phone, Mail, Users, Shield, Edit2, X, Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getAirlineByAdmin, updateAirline } from '@/Redux/airline/airlineThunks';
import { getUserProfile } from '@/Redux/user/userThunks';

const emptyAirlineData = {
  name: '',
  iataCode: '',
  icaoCode: '',
  alias: '',
  logoUrl: '',
  website: '',
  alliance: '',
  headquartersCityId: '',
  countryName: '',
  supportEmail: '',
  supportPhone: '',
  supportHours: ''
};

const toAirlineFormData = (airline) => {
  if (!airline) return emptyAirlineData;

  return {
    name: airline.name || '',
    iataCode: airline.iataCode || '',
    icaoCode: airline.icaoCode || '',
    alias: airline.alias || '',
    logoUrl: airline.logoUrl || '',
    website: airline.website || '',
    alliance: airline.alliance || '',
    headquartersCityId: airline.headquartersCityId || '',
    countryName: airline.countryName || '',
    supportEmail: airline.support?.email || airline.supportEmail || '',
    supportPhone: airline.support?.phone || airline.supportPhone || '',
    supportHours: airline.support?.hours || airline.supportHours || ''
  };
};

const FormField = ({ name, label, value, onChange, type = "text", disabled = false, as = null, rows = null, error }) => (
  <div className="space-y-2">
    <Label htmlFor={name}>{label}</Label>
    {as === 'textarea' ? (
      <Textarea
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        className={error ? 'border-red-500' : ''}
      />
    ) : (
      <Input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      />
    )}
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

export default function AirlineAdminProfile() {
  const dispatch = useDispatch();
  const { currentAirline, loading, error, updateLoading } = useSelector((state) => state.airline);
  const { userProfile } = useSelector((state) => state.user);

  const [editMode, setEditMode] = useState({
    airline: false,
    support: false
  });

  const [airlineData, setAirlineData] = useState(emptyAirlineData);

  const [errors, setErrors] = useState({});
  const [tempData, setTempData] = useState({});
  const [saveMessage, setSaveMessage] = useState('');
  const currentAirlineData = toAirlineFormData(currentAirline);
  const hasActiveEdit = editMode.airline || editMode.support;
  const displayData = hasActiveEdit ? airlineData : currentAirlineData;

  // Fetch airline data on component mount
  useEffect(() => {
    dispatch(getAirlineByAdmin());
    dispatch(getUserProfile());
  }, [dispatch]);

  const ownerSource = userProfile || currentAirline?.owner;
  const ownerData = ownerSource ? {
    name: ownerSource.fullName || '',
    title: 'Airline Administrator',
    email: ownerSource.email || '',
    phone: ownerSource.phone || '',
    joined: ownerSource.createdAt
      ? new Date(ownerSource.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : ownerSource.lastLogin
        ? new Date(ownerSource.lastLogin).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'N/A',
    role: ownerSource.role || 'AIRLINE_OWNER'
  } : {
    name: 'Airline Owner',
    title: 'Administrator',
    email: '',
    phone: '',
    joined: '',
    role: ''
  };

  const validateAirline = (data) => {
    const newErrors = {};

    if (!data.iataCode || data.iataCode.trim().length !== 2) {
      newErrors.iataCode = 'IATA code must be exactly 2 characters';
    }

    if (!data.icaoCode || data.icaoCode.trim().length !== 3) {
      newErrors.icaoCode = 'ICAO code must be exactly 3 characters';
    }

    if (!data.name || data.name.trim().length < 2) {
      newErrors.name = 'Airline name is required (min 2 characters)';
    }

    if (data.website && data.website.trim() && !isValidUrl(data.website)) {
      newErrors.website = 'Valid website URL is required';
    }

    if (data.logoUrl && data.logoUrl.trim() && !isValidUrl(data.logoUrl)) {
      newErrors.logoUrl = 'Valid logo URL is required';
    }

    return newErrors;
  };

  const validateSupport = (data) => {
    const newErrors = {};

    if (data.supportEmail && data.supportEmail.trim() && !isValidEmail(data.supportEmail)) {
      newErrors.supportEmail = 'Please enter a valid support email';
    }

    if (!data.supportPhone || data.supportPhone.trim().length === 0) {
      newErrors.supportPhone = 'Support phone is required';
    }

    if (!data.supportHours || data.supportHours.trim().length === 0) {
      newErrors.supportHours = 'Support hours are required';
    }

    return newErrors;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const toggleEdit = (section) => {
    if (!editMode[section]) {
      // Entering edit mode - store current data
      setAirlineData({ ...currentAirlineData });
      setTempData({ ...currentAirlineData });
    } else {
      // Canceling edit mode - restore original data
      setAirlineData({ ...tempData });
      setErrors({});
    }
    setEditMode(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async (section) => {
    try {
      setErrors({});
      setSaveMessage('');

      if (!currentAirline?.id) {
        setErrors({ submit: 'Airline profile is not ready yet. Please refresh and try again.' });
        return;
      }

      let validationErrors = {};

      if (section === 'airline') {
        validationErrors = validateAirline(airlineData);
      } else if (section === 'support') {
        validationErrors = validateSupport(airlineData);
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const headquartersCityId = airlineData.headquartersCityId
        ? Number(airlineData.headquartersCityId)
        : null;

      const updateData = {
        id: currentAirline.id,
        iataCode: airlineData.iataCode.trim().toUpperCase(),
        icaoCode: airlineData.icaoCode.trim().toUpperCase(),
        name: airlineData.name.trim(),
        alias: airlineData.alias.trim(),
        logoUrl: airlineData.logoUrl.trim(),
        website: airlineData.website.trim(),
        status: currentAirline?.status || 'ACTIVE',
        alliance: airlineData.alliance.trim(),
        supportEmail: airlineData.supportEmail.trim(),
        supportPhone: airlineData.supportPhone.trim(),
        supportHours: airlineData.supportHours.trim()
      };

      if (headquartersCityId) {
        updateData.headquartersCityId = headquartersCityId;
      }

      await dispatch(updateAirline(updateData)).unwrap();

      setTempData({});
      setSaveMessage(`${section === 'airline' ? 'Airline' : 'Support'} information updated successfully!`);
      setEditMode(prev => ({ ...prev, [section]: false }));

      setTimeout(() => {
        setSaveMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error updating airline:', error);
      setErrors({ submit: typeof error === 'string' ? error : 'Failed to update airline information' });
    }
  };

  const handleFieldChange = (field, value) => {
    setAirlineData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRefresh = () => {
    dispatch(getAirlineByAdmin());
    dispatch(getUserProfile());
  };

  // Loading state
  if (loading && !currentAirline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading airline profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentAirline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Error loading airline profile
              </h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                  {displayData.logoUrl ? (
                    <img
                      src={displayData.logoUrl}
                      alt={displayData.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150';
                        e.target.className = 'w-full h-full object-contain rounded-lg p-2';
                      }}
                    />
                  ) : (
                    currentAirline?.iataCode || 'AL'
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{displayData.name}</h1>
                  <p className="text-gray-600">Admin Dashboard</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {currentAirline?.status || 'ACTIVE'}
                    </Badge>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {saveMessage && (
              <Alert className="mt-4 bg-green-100 border-green-400">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {saveMessage}
                </AlertDescription>
              </Alert>
            )}
            {errors.submit && (
              <Alert className="mt-4 bg-red-100 border-red-400">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="airline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="airline" className="flex items-center gap-2">
              <Plane size={18} />
              <span className="hidden sm:inline">Airline</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <Phone size={18} />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="owner" className="flex items-center gap-2">
              <Shield size={18} />
              <span className="hidden sm:inline">Owner</span>
            </TabsTrigger>
          </TabsList>

          {/* Airline Details Tab */}
          <TabsContent value="airline">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="text-blue-600" />
                      Airline Details
                    </CardTitle>
                    <CardDescription>Manage your airline information</CardDescription>
                  </div>
                  {!editMode.airline ? (
                    <Button onClick={() => toggleEdit('airline')}>
                      <Edit2 className="mr-2" size={18} />
                      Edit
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Airline Logo URL</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                        {displayData.logoUrl ? (
                          <img
                            src={displayData.logoUrl}
                            alt="Airline Logo" 
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150';
                              e.target.className = 'w-full h-full object-contain rounded-lg p-2';
                            }}
                          />
                        ) : (
                          currentAirline?.iataCode || 'AL'
                        )}
                      </div>
                      {editMode.airline && (
                        <div className="flex-1">
                          <Input
                            type="url"
                            value={displayData.logoUrl}
                            onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                            placeholder="Enter logo URL"
                            className={errors.logoUrl ? 'border-red-500' : ''}
                          />
                          {errors.logoUrl && <p className="text-sm text-red-500 mt-1">{errors.logoUrl}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField 
                      name="name" 
                      label="Airline Name" 
                      value={displayData.name}
                      onChange={(val) => handleFieldChange('name', val)}
                      disabled={!editMode.airline}
                      error={errors.name}
                    />
                    <FormField 
                      name="iataCode" 
                      label="IATA Code" 
                      value={displayData.iataCode}
                      onChange={(val) => handleFieldChange('iataCode', val)}
                      disabled={!editMode.airline}
                      error={errors.iataCode}
                    />
                    <FormField 
                      name="icaoCode" 
                      label="ICAO Code" 
                      value={displayData.icaoCode}
                      onChange={(val) => handleFieldChange('icaoCode', val)}
                      disabled={!editMode.airline}
                      error={errors.icaoCode}
                    />
                    <FormField 
                      name="alias" 
                      label="Alias" 
                      value={displayData.alias}
                      onChange={(val) => handleFieldChange('alias', val)}
                      disabled={!editMode.airline}
                    />
                    <FormField
                      name="countryName"
                      label="Country"
                      value={displayData.countryName}
                      onChange={() => {}}
                      disabled
                    />
                    <FormField 
                      name="alliance" 
                      label="Alliance" 
                      value={displayData.alliance}
                      onChange={(val) => handleFieldChange('alliance', val)}
                      disabled={!editMode.airline}
                    />
                    <FormField 
                      name="website" 
                      label="Website" 
                      value={displayData.website}
                      onChange={(val) => handleFieldChange('website', val)}
                      disabled={!editMode.airline}
                      error={errors.website}
                    />
                    <FormField 
                      name="headquartersCityId" 
                      label="Headquarters City ID" 
                      type="number"
                      value={displayData.headquartersCityId}
                      onChange={(val) => handleFieldChange('headquartersCityId', val)}
                      disabled={!editMode.airline}
                    />
                  </div>

                  {editMode.airline && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={() => handleSave('airline')} disabled={updateLoading}>
                        {updateLoading ? (
                          <Loader2 className="mr-2 animate-spin" size={18} />
                        ) : (
                          <Check className="mr-2" size={18} />
                        )}
                        {updateLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={() => toggleEdit('airline')} disabled={updateLoading}>
                        <X className="mr-2" size={18} />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Details Tab */}
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="text-green-600" />
                      Support Details
                    </CardTitle>
                    <CardDescription>Manage customer support information</CardDescription>
                  </div>
                  {!editMode.support ? (
                    <Button onClick={() => toggleEdit('support')}>
                      <Edit2 className="mr-2" size={18} />
                      Edit
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField 
                      name="supportEmail" 
                      label="Support Email" 
                      type="email"
                      value={displayData.supportEmail}
                      onChange={(val) => handleFieldChange('supportEmail', val)}
                      disabled={!editMode.support}
                      error={errors.supportEmail}
                    />
                    <FormField 
                      name="supportPhone" 
                      label="Support Phone"
                      value={displayData.supportPhone}
                      onChange={(val) => handleFieldChange('supportPhone', val)}
                      disabled={!editMode.support}
                      error={errors.supportPhone}
                    />
                    <FormField 
                      name="supportHours" 
                      label="Support Hours"
                      value={displayData.supportHours}
                      onChange={(val) => handleFieldChange('supportHours', val)}
                      disabled={!editMode.support}
                      error={errors.supportHours}
                    />
                  </div>

                  {editMode.support && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={() => handleSave('support')} disabled={updateLoading}>
                        {updateLoading ? (
                          <Loader2 className="mr-2 animate-spin" size={18} />
                        ) : (
                          <Check className="mr-2" size={18} />
                        )}
                        {updateLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={() => toggleEdit('support')} disabled={updateLoading}>
                        <X className="mr-2" size={18} />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Owner Details Tab */}
          <TabsContent value="owner">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="text-amber-600" />
                    Owner Details
                  </CardTitle>
                  <Badge variant="secondary">View Only</Badge>
                </div>
                <CardDescription>Owner information is protected and cannot be modified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border-2 border-amber-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {ownerData.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{ownerData.name}</h3>
                      <p className="text-amber-700 font-medium">{ownerData.title}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Mail size={18} />
                          <span className="text-sm font-medium">Email</span>
                        </div>
                        <p className="text-gray-800 font-medium">{ownerData.email}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Phone size={18} />
                          <span className="text-sm font-medium">Phone</span>
                        </div>
                        <p className="text-gray-800 font-medium">{ownerData.phone}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Users size={18} />
                          <span className="text-sm font-medium">Joined</span>
                        </div>
                        <p className="text-gray-800 font-medium">{ownerData.joined}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Shield size={18} />
                          <span className="text-sm font-medium">Role</span>
                        </div>
                        <p className="text-gray-800 font-medium">{ownerData.role}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert className="mt-4 bg-amber-100 border-amber-300">
                    <Shield className="h-4 w-4 text-amber-800" />
                    <AlertDescription className="text-amber-800">
                      <span className="font-medium">Note:</span> Owner information is protected and cannot be modified.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

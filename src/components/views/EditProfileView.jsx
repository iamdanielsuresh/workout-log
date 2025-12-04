import { useState, useEffect } from 'react';
import { 
  User, Calendar, Ruler, Scale, Percent, X, Save, Camera, Globe, Clock, 
  Target, AlertTriangle, Activity, ChevronDown, Dumbbell, Heart 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ViewHeader } from '../layout/Navigation';
import { COUNTRIES, TIMEZONES, getDefaultTimezone, detectUserTimezone } from '../../constants/countries';

/**
 * Edit Profile View - Full screen profile editor
 */
export function EditProfileView({ 
  onBack, 
  profile, 
  userPhoto,
  onSave 
}) {
  const [formData, setFormData] = useState({
    displayName: '',
    gender: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    bodyFat: '',
    experienceLevel: 'intermediate',
    country: '',
    timezone: '',
    goals: '',
    trainingAge: '',
    injuries: '',
    activityLevel: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.display_name || '',
        gender: profile.gender || '',
        dateOfBirth: profile.date_of_birth || '',
        height: profile.height ? String(profile.height) : '',
        weight: profile.weight ? String(profile.weight) : '',
        bodyFat: profile.body_fat ? String(profile.body_fat) : '',
        experienceLevel: profile.experience_level || 'intermediate',
        country: profile.country || '',
        timezone: profile.timezone || detectUserTimezone(),
        goals: profile.goals || '',
        trainingAge: profile.training_age ? String(profile.training_age) : '',
        injuries: profile.injuries || '',
        activityLevel: profile.activity_level || ''
      });
      setErrors({});
    }
  }, [profile]);

  // Auto-set timezone when country changes
  const handleCountryChange = (countryCode) => {
    updateField('country', countryCode);
    if (countryCode && !formData.timezone) {
      updateField('timezone', getDefaultTimezone(countryCode));
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(formData.dateOfBirth);

  const validate = () => {
    const newErrors = {};
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (age < 13 || age > 120) {
      newErrors.dateOfBirth = 'Please enter a valid date of birth';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        display_name: formData.displayName.trim(),
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
        age,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        body_fat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
        photo_url: userPhoto || profile?.photo_url || null,
        experience_level: formData.experienceLevel,
        country: formData.country || null,
        timezone: formData.timezone || null,
        goals: formData.goals || null,
        training_age: formData.trainingAge ? parseInt(formData.trainingAge) : null,
        injuries: formData.injuries || null,
        activity_level: formData.activityLevel || null
      });
      onBack();
    } catch (error) {
      setErrors({ general: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', desc: '0-1 years' },
    { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
    { value: 'professional', label: 'Professional', desc: '3+ years' }
  ];

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-950 overflow-x-hidden">
      <ViewHeader 
        title="Edit Profile" 
        onBack={onBack}
        rightAction={
          <Button 
            size="sm" 
            icon={Save} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      <div className="p-6 space-y-8 pb-32">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            {(userPhoto || profile?.photo_url) ? (
              <img
                src={userPhoto || profile?.photo_url}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-emerald-500/20 object-cover shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center shadow-xl">
                <User className="w-10 h-10 text-gray-500" />
              </div>
            )}
          </div>
        </div>

        {/* General error */}
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-sm text-red-400">{errors.general}</p>
          </div>
        )}

        {/* Section: Basic Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" /> Basic Info
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Display Name</label>
              <Input
                value={formData.displayName}
                onChange={(e) => updateField('displayName', e.target.value)}
                placeholder="Your name"
                icon={User}
                error={errors.displayName}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Gender</label>
                <div className="flex gap-2">
                  {['male', 'female'].map((g) => (
                    <button
                      key={g}
                      onClick={() => updateField('gender', g)}
                      className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all capitalize border ${
                        formData.gender === g
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="text-xs text-red-400 mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Date of Birth</label>
                <div className="w-full sm:w-2/3">
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    icon={Calendar}
                    error={errors.dateOfBirth}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Body Metrics */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" /> Body Metrics
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Height (cm)</label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => updateField('height', e.target.value)}
                placeholder="175"
                className="text-center px-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Weight (kg)</label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => updateField('weight', e.target.value)}
                placeholder="70"
                className="text-center px-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Body Fat %</label>
              <Input
                type="number"
                value={formData.bodyFat}
                onChange={(e) => updateField('bodyFat', e.target.value)}
                placeholder="15"
                className="text-center px-2"
              />
            </div>
          </div>
        </div>

        {/* Section: Fitness Profile */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> Fitness Profile
          </h4>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Experience Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {experienceLevels.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => updateField('experienceLevel', value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.experienceLevel === value
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : 'border-white/10 bg-gray-900/30 hover:bg-gray-900/50'
                  }`}
                >
                  <p className={`text-sm font-bold ${formData.experienceLevel === value ? 'text-emerald-400' : 'text-gray-300'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Training Age (years)</label>
              <Input
                type="number"
                value={formData.trainingAge}
                onChange={(e) => updateField('trainingAge', e.target.value)}
                placeholder="e.g. 2"
                icon={Clock}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Activity Level</label>
              <Select
                value={formData.activityLevel}
                onChange={(e) => updateField('activityLevel', e.target.value)}
                icon={Activity}
                placeholder="Select Level"
                options={[
                  { value: 'sedentary', label: 'Sedentary' },
                  { value: 'light', label: 'Light' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'active', label: 'Active' },
                  { value: 'very_active', label: 'Very Active' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section: Goals & Health */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" /> Goals & Health
          </h4>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fitness Goals</label>
            <textarea
              value={formData.goals}
              onChange={(e) => updateField('goals', e.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full bg-gray-900/50 border border-white/10 rounded-xl p-3 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 text-sm resize-none min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Injuries / Limitations</label>
            <textarea
              value={formData.injuries}
              onChange={(e) => updateField('injuries', e.target.value)}
              placeholder="Any injuries we should know about?"
              className="w-full bg-gray-900/50 border border-white/10 rounded-xl p-3 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 text-sm resize-none min-h-[80px]"
            />
          </div>
        </div>

        {/* Section: Location */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4" /> Location
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Country</label>
              <Select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                icon={Globe}
                placeholder="Select Country"
                options={COUNTRIES.map(c => ({ value: c.code, label: c.name }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Timezone</label>
              <Select
                value={formData.timezone}
                onChange={(e) => updateField('timezone', e.target.value)}
                icon={Clock}
                placeholder="Select Timezone"
                options={TIMEZONES}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur p-4 border-t border-white/5 z-10">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={handleSubmit}
              loading={saving}
              disabled={saving}
              className="w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              icon={Save}
            >
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfileView;

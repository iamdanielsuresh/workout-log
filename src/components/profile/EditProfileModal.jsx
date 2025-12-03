import { useState, useEffect } from 'react';
import { User, Calendar, Ruler, Scale, Percent, X, Save, Camera, Globe, Clock, Target, AlertTriangle, Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { COUNTRIES, TIMEZONES, getDefaultTimezone, detectUserTimezone } from '../../constants/countries';

/**
 * Edit Profile Modal - Allows editing profile after onboarding
 */
export function EditProfileModal({ 
  isOpen, 
  onClose, 
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
    // Extended health metrics (Task 6)
    goals: '',
    trainingAge: '',
    injuries: '',
    activityLevel: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profile && isOpen) {
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
        // Extended health metrics
        goals: profile.goals || '',
        trainingAge: profile.training_age ? String(profile.training_age) : '',
        injuries: profile.injuries || '',
        activityLevel: profile.activity_level || ''
      });
      setErrors({});
    }
  }, [profile, isOpen]);

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
        // Extended health metrics
        goals: formData.goals || null,
        training_age: formData.trainingAge ? parseInt(formData.trainingAge) : null,
        injuries: formData.injuries || null,
        activity_level: formData.activityLevel || null
      });
      onClose();
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

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <div className="space-y-5">
        {/* Profile Picture */}
        <div className="flex justify-center">
          <div className="relative">
            {(userPhoto || profile?.photo_url) ? (
              <img
                src={userPhoto || profile?.photo_url}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-emerald-500/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-600" />
              </div>
            )}
          </div>
        </div>

        {/* General error */}
        {errors.general && (
          <p className="text-sm text-red-400 text-center">{errors.general}</p>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Name <span className="text-red-400">*</span>
          </label>
          <Input
            value={formData.displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
            placeholder="Your name"
            icon={User}
            error={errors.displayName}
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Gender <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['male', 'female'].map((g) => (
              <button
                key={g}
                onClick={() => updateField('gender', g)}
                className={`p-3 rounded-xl border transition-all ${
                  formData.gender === g
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span className="capitalize font-medium">{g}</span>
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-xs text-red-400 mt-1">{errors.gender}</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date of Birth <span className="text-red-400">*</span>
          </label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            icon={Calendar}
            error={errors.dateOfBirth}
          />
          {age && !errors.dateOfBirth && (
            <p className="text-xs text-gray-500 mt-1">{age} years old</p>
          )}
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Experience Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {experienceLevels.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => updateField('experienceLevel', value)}
                className={`p-3 rounded-xl border transition-all text-center ${
                  formData.experienceLevel === value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs opacity-70">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Fields */}
        <div className="pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-3">Optional Information</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Height (cm)</label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => updateField('height', e.target.value)}
                placeholder="175"
                className="text-center"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Weight (kg)</label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => updateField('weight', e.target.value)}
                placeholder="70"
                className="text-center"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Body Fat %</label>
              <Input
                type="number"
                value={formData.bodyFat}
                onChange={(e) => updateField('bodyFat', e.target.value)}
                placeholder="15"
                className="text-center"
              />
            </div>
          </div>
        </div>

        {/* Location & Timezone (Task 1) */}
        <div className="pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Location & Timezone
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Country</label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none text-sm"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => updateField('timezone', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none text-sm"
              >
                <option value="">Select Timezone</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Extended Health Metrics (Task 6) */}
        <div className="pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Health & Fitness Goals (Helps AI personalization)
          </p>
          
          {/* Goals */}
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Fitness Goals</label>
            <textarea
              value={formData.goals}
              onChange={(e) => updateField('goals', e.target.value)}
              placeholder="e.g., Build muscle, lose fat, improve strength..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Training Age & Activity Level */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Training Age (years)</label>
              <Input
                type="number"
                value={formData.trainingAge}
                onChange={(e) => updateField('trainingAge', e.target.value)}
                placeholder="2"
                className="text-center"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Activity Level</label>
              <select
                value={formData.activityLevel}
                onChange={(e) => updateField('activityLevel', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none text-sm"
              >
                <option value="">Select Level</option>
                <option value="sedentary">Sedentary (Desk Job)</option>
                <option value="light">Light (1-2 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very_active">Very Active (Athlete)</option>
              </select>
            </div>
          </div>

          {/* Injuries/Limitations */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Injuries or Limitations
            </label>
            <textarea
              value={formData.injuries}
              onChange={(e) => updateField('injuries', e.target.value)}
              placeholder="e.g., Lower back pain, shoulder mobility issues..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none text-sm resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSubmit}
          loading={saving}
          disabled={saving}
          className="w-full"
          icon={Save}
        >
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}


export default EditProfileModal;

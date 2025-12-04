import { useState } from 'react';
import { User, Calendar, Ruler, Scale, Percent, ChevronRight, Camera } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

/**
 * Profile Setup Component - First step after signup
 * Collects mandatory (name, DOB) and optional (height, weight, body fat) info
 */
export function ProfileSetup({ userPhoto, userName, onComplete }) {
  const [profile, setProfile] = useState({
    displayName: userName || '',
    gender: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    bodyFat: '',
  });
  const [errors, setErrors] = useState({});

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

  const age = calculateAge(profile.dateOfBirth);

  const validate = () => {
    const newErrors = {};
    if (!profile.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    }
    if (!profile.gender) {
      newErrors.gender = 'Gender is required';
    }
    if (!profile.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (age < 13 || age > 120) {
      newErrors.dateOfBirth = 'Please enter a valid date of birth';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onComplete({
        display_name: profile.displayName.trim(),
        gender: profile.gender,
        date_of_birth: profile.dateOfBirth,
        age,
        height: profile.height ? parseFloat(profile.height) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        body_fat: profile.bodyFat ? parseFloat(profile.bodyFat) : null,
        photo_url: userPhoto || null,
      });
    }
  };

  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-gray-100 mb-2 tracking-tight">Create Your Profile</h2>
        <p className="text-gray-500 text-sm">Tell us a bit about yourself</p>
      </div>

      {/* Profile Picture */}
      <div className="flex justify-center">
        <div className="relative">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-emerald-500/30 shadow-lg shadow-emerald-500/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-600" />
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <Camera className="w-4 h-4 text-gray-950" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Name - Required */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Name <span className="text-red-400">*</span>
          </label>
          <Input
            value={profile.displayName}
            onChange={(e) => updateProfile('displayName', e.target.value)}
            placeholder="Your name"
            icon={User}
            error={errors.displayName}
          />
        </div>

        {/* Gender - Required */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Gender <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['male', 'female'].map((g) => (
              <button
                key={g}
                onClick={() => updateProfile('gender', g)}
                className={`p-3 rounded-xl border transition-all ${
                  profile.gender === g
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

        {/* Date of Birth - Required */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Date of Birth <span className="text-red-400">*</span>
          </label>
          <Input
            type="date"
            value={profile.dateOfBirth}
            onChange={(e) => updateProfile('dateOfBirth', e.target.value)}
            icon={Calendar}
            error={errors.dateOfBirth}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth}</p>
          )}
          {age && !errors.dateOfBirth && (
            <p className="mt-1 text-sm text-emerald-400">{age} years old</p>
          )}
        </div>

        {/* Optional Fields Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-gray-900 text-xs text-gray-600 uppercase tracking-wider">
              Optional Info
            </span>
          </div>
        </div>

        {/* Height & Weight Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Height (cm)
            </label>
            <Input
              type="number"
              value={profile.height}
              onChange={(e) => updateProfile('height', e.target.value)}
              placeholder="175"
              icon={Ruler}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Weight (kg)
            </label>
            <Input
              type="number"
              value={profile.weight}
              onChange={(e) => updateProfile('weight', e.target.value)}
              placeholder="70"
              icon={Scale}
            />
          </div>
        </div>

        {/* Body Fat */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Body Fat %
          </label>
          <Input
            type="number"
            value={profile.bodyFat}
            onChange={(e) => updateProfile('bodyFat', e.target.value)}
            placeholder="15"
            icon={Percent}
          />
          <p className="mt-1 text-xs text-gray-600">
            This helps the AI give better recommendations
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleSubmit}
        size="xl"
        className="w-full"
        icon={ChevronRight}
      >
        Continue
      </Button>
    </div>
  );
}

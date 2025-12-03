import { useState, useEffect } from 'react';
import { User, Calendar, Ruler, Scale, Percent, X, Save, Camera } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

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
    dateOfBirth: '',
    height: '',
    weight: '',
    bodyFat: '',
    experienceLevel: 'intermediate'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        displayName: profile.display_name || '',
        dateOfBirth: profile.date_of_birth || '',
        height: profile.height ? String(profile.height) : '',
        weight: profile.weight ? String(profile.weight) : '',
        bodyFat: profile.body_fat ? String(profile.body_fat) : '',
        experienceLevel: profile.experience_level || 'intermediate'
      });
      setErrors({});
    }
  }, [profile, isOpen]);

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
        date_of_birth: formData.dateOfBirth,
        age,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        body_fat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
        photo_url: userPhoto || profile?.photo_url || null,
        experience_level: formData.experienceLevel
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

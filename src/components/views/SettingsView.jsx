import { useState, useEffect } from 'react';
import { 
  User, Sparkles, Key, Check, X, LogOut, 
  UserX, AlertTriangle, Edit3, ExternalLink, Bell
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ViewHeader } from '../layout/Navigation';
import { verifyApiKey } from '../../services/ai';

/**
 * SettingsView - Account settings, AI configuration, and profile management
 */
export function SettingsView({ 
  currentSettings, profile, isAnonymous, 
  onSave, onEditProfile, onNotificationSettings, onSignOut, onDeleteAccount 
}) {
  const [aiEnabled, setAiEnabled] = useState(currentSettings?.ai_enabled || false);
  const [apiKey, setApiKey] = useState(currentSettings?.google_api_key || '');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setAiEnabled(currentSettings.ai_enabled || false);
      setApiKey(currentSettings.google_api_key || '');
      // If we already have a saved API key, consider it verified
      setIsVerified(!!currentSettings.google_api_key);
    }
  }, [currentSettings]);

  // Reset verification when API key changes
  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    setError('');
    setSuccessMessage('');
    // Only reset verification if key changed from saved value
    if (newKey !== currentSettings?.google_api_key) {
      setIsVerified(false);
    }
  };

  // Verify API key
  const handleVerifyKey = async () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await verifyApiKey(apiKey);
      if (result.valid) {
        setIsVerified(true);
        setSuccessMessage('API key verified! ✓');
      } else {
        setError(result.error || 'Invalid API key');
        setIsVerified(false);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setIsVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    // If AI is enabled but key isn't verified, verify first
    if (aiEnabled && apiKey && !isVerified) {
      setError('Please verify your API key first');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await onSave({
        ai_enabled: aiEnabled,
        google_api_key: aiEnabled ? apiKey : null,
        onboarding_completed: true
      });
      setSuccessMessage('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await onSignOut();
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await onDeleteAccount();
    } catch (error) {
      setError('Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ViewHeader 
        title="Settings" 
        subtitle="Manage your account"
      />

      <div className="p-6 space-y-4">
        {/* Profile Info */}
        {profile && (
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-3">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-14 h-14 rounded-full" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-display font-bold text-gray-200 text-xl tracking-tight">{profile.display_name}</p>
                <p className="text-sm text-gray-500">
                  {profile.experience_level ? `${profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)} lifter` : ''}
                  {profile.age ? ` • ${profile.age} years old` : ''}
                </p>
              </div>
              <button
                onClick={onEditProfile}
                className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all text-gray-400 hover:text-gray-200"
                aria-label="Edit profile"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* AI Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-display font-bold text-gray-600 uppercase tracking-wider px-1">AI Features</h3>
          
          <div className="bg-gray-900/50 rounded-xl border border-white/10 shadow-lg shadow-black/20 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-200">AI Workout Buddy</p>
                  <p className="text-xs text-gray-500">Get personalized tips</p>
                </div>
              </div>
              <button
                role="switch"
                aria-checked={aiEnabled}
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`relative w-12 h-6 rounded-full transition-all ${aiEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${aiEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {aiEnabled && (
              <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-2">
                <div className="h-px bg-gray-800 mb-4" />
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Google AI Studio API Key
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={handleApiKeyChange}
                      placeholder="AIza..."
                      icon={Key}
                    />
                  </div>
                  <Button
                    onClick={handleVerifyKey}
                    disabled={!apiKey || verifying || isVerified}
                    loading={verifying}
                    variant={isVerified ? 'primary' : 'secondary'}
                    className={`px-4 ${isVerified ? 'bg-emerald-600' : ''}`}
                  >
                    {isVerified ? <Check className="w-4 h-4" /> : 'Verify'}
                  </Button>
                </div>
                
                {error && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {error}
                  </p>
                )}
                
                {successMessage && (
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {successMessage}
                  </p>
                )}

                <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    To use AI features, you need a free API key from Google AI Studio.
                  </p>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1 font-medium"
                  >
                    Get API Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSave} 
            loading={saving}
            className="w-full"
            icon={Check}
          >
            Save Changes
          </Button>
        </div>

        {/* Notifications Section (Task 7) */}
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider px-1">Notifications</h3>
          
          <Button
            onClick={onNotificationSettings}
            variant="secondary"
            className="w-full"
            icon={Bell}
          >
            Notification Settings
          </Button>
        </div>

        {/* Account Section */}
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider px-1">Account</h3>
          
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="w-full"
            icon={LogOut}
          >
            {isAnonymous ? 'Sign Out (Guest)' : 'Sign Out'}
          </Button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2 bg-red-500/5 rounded-xl border border-red-500/20"
            >
              <UserX className="w-4 h-4" />
              Delete Account
            </button>
          ) : (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400">Delete Account?</p>
                  <p className="text-xs text-gray-500 mt-1">
                    This will permanently delete your account and all workout data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  loading={deleteLoading}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsView;

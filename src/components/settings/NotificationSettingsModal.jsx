import { useState, useEffect } from 'react';
import { 
  Bell, BellOff, Clock, Calendar, Flame, 
  Sparkles, Check, AlertCircle, Settings
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

/**
 * Notification Settings Modal
 * Task 7: Notifications System
 */
export function NotificationSettingsModal({ 
  isOpen, 
  onClose, 
  settings,
  permissionStatus,
  onSave,
  onRequestPermission,
  onTestNotification,
  onToast
}) {
  const [localSettings, setLocalSettings] = useState({
    workout_reminders_enabled: true,
    streak_alerts_enabled: true,
    motivation_enabled: true,
    reminder_time: '09:00',
    reminder_days: [1, 2, 3, 4, 5]
  });
  const [saving, setSaving] = useState(false);

  // Initialize local settings from props
  useEffect(() => {
    if (settings && isOpen) {
      setLocalSettings({
        workout_reminders_enabled: settings.workout_reminders_enabled ?? true,
        streak_alerts_enabled: settings.streak_alerts_enabled ?? true,
        motivation_enabled: settings.motivation_enabled ?? true,
        reminder_time: settings.reminder_time || '09:00',
        reminder_days: settings.reminder_days || [1, 2, 3, 4, 5]
      });
    }
  }, [settings, isOpen]);

  const handleToggle = (key) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTimeChange = (time) => {
    setLocalSettings(prev => ({
      ...prev,
      reminder_time: time
    }));
  };

  const handleDayToggle = (day) => {
    setLocalSettings(prev => {
      const days = prev.reminder_days.includes(day)
        ? prev.reminder_days.filter(d => d !== day)
        : [...prev.reminder_days, day].sort((a, b) => a - b);
      return { ...prev, reminder_days: days };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      onToast?.({ message: 'Notification settings saved!', type: 'success' });
      onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      onToast?.({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = () => {
    if (permissionStatus === 'granted') {
      onTestNotification?.('Workout Log', 'Test notification! Your reminders are working.', {
        tag: 'test'
      });
    }
  };

  const DAYS = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  const renderPermissionStatus = () => {
    if (permissionStatus === 'granted') {
      return (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <Check className="w-4 h-4" />
          Notifications enabled
        </div>
      );
    }
    
    if (permissionStatus === 'denied') {
      return (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Notifications blocked
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Please enable notifications in your browser settings.
          </p>
        </div>
      );
    }

    if (permissionStatus === 'unsupported') {
      return (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Browser doesn't support notifications
          </p>
        </div>
      );
    }

    return (
      <Button
        onClick={onRequestPermission}
        variant="secondary"
        size="sm"
        icon={Bell}
      >
        Enable Notifications
      </Button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Settings">
      <div className="space-y-5">
        {/* Permission Status */}
        <div>
          <label className="block text-sm font-display font-medium text-gray-400 mb-2">
            Permission Status
          </label>
          {renderPermissionStatus()}
        </div>

        {/* Notification Types */}
        <div>
          <label className="block text-sm font-display font-medium text-gray-400 mb-3">
            Notification Types
          </label>
          <div className="space-y-3">
            {/* Workout Reminders */}
            <Card 
              hover={false} 
              className={`p-4 cursor-pointer transition-all ${
                localSettings.workout_reminders_enabled 
                  ? 'border-emerald-500/30 bg-emerald-500/5' 
                  : ''
              }`}
              onClick={() => handleToggle('workout_reminders_enabled')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    localSettings.workout_reminders_enabled 
                      ? 'bg-emerald-500/20' 
                      : 'bg-gray-800'
                  }`}>
                    <Bell className={`w-5 h-5 ${
                      localSettings.workout_reminders_enabled 
                        ? 'text-emerald-400' 
                        : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-display font-medium text-gray-200">Workout Reminders</p>
                    <p className="text-xs text-gray-500">Daily reminder to workout</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all ${
                  localSettings.workout_reminders_enabled ? 'bg-emerald-500' : 'bg-gray-700'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-all ${
                    localSettings.workout_reminders_enabled ? 'ml-5' : 'ml-1'
                  }`} />
                </div>
              </div>
            </Card>

            {/* Streak Alerts */}
            <Card 
              hover={false} 
              className={`p-4 cursor-pointer transition-all ${
                localSettings.streak_alerts_enabled 
                  ? 'border-amber-500/30 bg-amber-500/5' 
                  : ''
              }`}
              onClick={() => handleToggle('streak_alerts_enabled')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    localSettings.streak_alerts_enabled 
                      ? 'bg-amber-500/20' 
                      : 'bg-gray-800'
                  }`}>
                    <Flame className={`w-5 h-5 ${
                      localSettings.streak_alerts_enabled 
                        ? 'text-amber-400' 
                        : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-display font-medium text-gray-200">Streak Alerts</p>
                    <p className="text-xs text-gray-500">Don't lose your streak!</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all ${
                  localSettings.streak_alerts_enabled ? 'bg-amber-500' : 'bg-gray-700'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-all ${
                    localSettings.streak_alerts_enabled ? 'ml-5' : 'ml-1'
                  }`} />
                </div>
              </div>
            </Card>

            {/* Motivation Notifications */}
            <Card 
              hover={false} 
              className={`p-4 cursor-pointer transition-all ${
                localSettings.motivation_enabled 
                  ? 'border-purple-500/30 bg-purple-500/5' 
                  : ''
              }`}
              onClick={() => handleToggle('motivation_enabled')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    localSettings.motivation_enabled 
                      ? 'bg-purple-500/20' 
                      : 'bg-gray-800'
                  }`}>
                    <Sparkles className={`w-5 h-5 ${
                      localSettings.motivation_enabled 
                        ? 'text-purple-400' 
                        : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <p className="font-display font-medium text-gray-200">Motivation</p>
                    <p className="text-xs text-gray-500">Occasional tips & insights</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all ${
                  localSettings.motivation_enabled ? 'bg-purple-500' : 'bg-gray-700'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-all ${
                    localSettings.motivation_enabled ? 'ml-5' : 'ml-1'
                  }`} />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Reminder Time */}
        {localSettings.workout_reminders_enabled && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Clock className="w-4 h-4 inline-block mr-1" />
              Reminder Time
            </label>
            <input
              type="time"
              value={localSettings.reminder_time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none"
            />
          </div>
        )}

        {/* Reminder Days */}
        {localSettings.workout_reminders_enabled && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Calendar className="w-4 h-4 inline-block mr-1" />
              Reminder Days
            </label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle(day.value)}
                  className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                    localSettings.reminder_days.includes(day.value)
                      ? 'bg-emerald-500 text-gray-950 font-medium'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Test Notification */}
        {permissionStatus === 'granted' && (
          <button
            onClick={handleTestNotification}
            className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Send test notification
          </button>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={saving}
          className="w-full"
          icon={Check}
        >
          Save Settings
        </Button>
      </div>
    </Modal>
  );
}

export default NotificationSettingsModal;

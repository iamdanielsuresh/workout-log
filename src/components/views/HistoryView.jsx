import { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, ChevronDown, ChevronUp, Trash2, Search, 
  Plus, Filter, Play, History, List, Calendar as CalendarIcon, Clock,
  Download, PlusCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { ViewHeader } from '../layout/Navigation';
import { Calendar } from '../ui/Calendar';
import { getExercises, createExercise } from '../../services/supabase';
import { formatDuration } from '../../utils/localeFormatters';

// Default exercise duration estimate (15 minutes in milliseconds)
const DEFAULT_EXERCISE_DURATION_MS = 15 * 60 * 1000;

/**
 * HistoryView - Workout history and Exercise Library
 * Task 3: Shows time details
 * Task 4: Calendar view
 * Task 8: Export functionality
 * Task 10: Add old logs by date
 */
export function HistoryView({ 
  workouts, 
  onBack, 
  onDelete, 
  onStartQuickWorkout, 
  onExport,
  onAddPastWorkout,
  initialTab = 'history' 
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'history' | 'calendar' | 'exercises'
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Exercises State
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle_group: '', equipment: '' });
  const [creatingExercise, setCreatingExercise] = useState(false);

  // Get all dates that have workouts for calendar marking
  const workoutDates = useMemo(() => {
    return workouts.map(w => w.workoutDate || w.timestamp?.toISOString().split('T')[0]);
  }, [workouts]);

  // Filter workouts by selected date
  const filteredWorkouts = useMemo(() => {
    if (!selectedDate) return workouts;
    return workouts.filter(w => {
      const workoutDateStr = w.workoutDate || w.timestamp?.toISOString().split('T')[0];
      return workoutDateStr === selectedDate;
    });
  }, [workouts, selectedDate]);

  useEffect(() => {
    if (activeTab === 'exercises' && exercises.length === 0) {
      fetchExercises();
    }
  }, [activeTab]);

  const fetchExercises = async () => {
    setLoadingExercises(true);
    try {
      const data = await getExercises();
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!newExercise.name) return;
    setCreatingExercise(true);
    try {
      const created = await createExercise(newExercise);
      setExercises(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAddExercise(false);
      setNewExercise({ name: '', muscle_group: '', equipment: '' });
    } catch (error) {
      console.error('Error creating exercise:', error);
    } finally {
      setCreatingExercise(false);
    }
  };

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscle_group?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time for display (Task 3)
  const formatTimeDisplay = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Handle date selection from calendar
  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ViewHeader 
        title={activeTab === 'history' ? 'Workout History' : activeTab === 'calendar' ? 'Calendar' : 'Exercise Library'} 
        subtitle={activeTab === 'history' 
          ? `${workouts.length} workout${workouts.length !== 1 ? 's' : ''} logged`
          : activeTab === 'calendar' 
            ? 'View workouts by date'
            : 'Browse and log exercises'
        }
        rightAction={
          activeTab === 'history' && (
            <div className="flex items-center gap-2">
              {onExport && (
                <button
                  onClick={onExport}
                  className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Export workouts"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              {onAddPastWorkout && (
                <button
                  onClick={onAddPastWorkout}
                  className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Add past workout"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          )
        }
      />

      {/* Tabs */}
      <div className="px-6 mb-4">
        <div className="flex p-1 bg-gray-900 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history' 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'calendar' 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'exercises' 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <List className="w-4 h-4" />
            Exercises
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="p-6 pt-0 space-y-6">
          {workouts.length === 0 && (
            <Card hover={false} className="p-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-display font-bold text-xl text-gray-400 mb-2">No workouts yet</h3>
              <p className="text-sm text-gray-600 mb-4">Start your first workout to see your history here</p>
              <Button onClick={onBack} size="sm">Start Workout</Button>
            </Card>
          )}

          {/* Group workouts by date */}
          {(() => {
            // Group workouts by date (YYYY-MM-DD)
            const groupedByDate = workouts.reduce((acc, session) => {
              const dateKey = session.workoutDate || (session.timestamp ? 
                session.timestamp.toISOString().split('T')[0] : 
                'Unknown Date');
              if (!acc[dateKey]) {
                acc[dateKey] = [];
              }
              acc[dateKey].push(session);
              return acc;
            }, {});

            // Sort dates in descending order (most recent first)
            const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

            return sortedDates.map((dateKey, dateIndex) => (
              <div key={dateKey} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards" style={{ animationDelay: `${dateIndex * 100}ms` }}>
                {/* Date Header */}
                <h2 className="font-display font-bold text-lg text-emerald-400 mb-3 tracking-tight">
                  {dateKey}
                </h2>
                
                <div className="space-y-3">
                  {groupedByDate[dateKey].map((session) => {
                    const isExpanded = expandedId === session.id;
                    const startTime = session.startTime 
                      ? formatTimeDisplay(session.startTime)
                      : (session.timestamp ? formatTimeDisplay(session.timestamp) : '');

                    return (
                      <Card 
                        key={session.id} 
                        hover={false} 
                        className="overflow-hidden"
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : session.id)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono text-gray-500">{startTime}</span>
                              <div>
                                <h3 className="font-display font-bold text-lg text-gray-200 tracking-tight">{session.workoutName}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500">
                                    {session.exercises?.length || 0} exercises
                                  </span>
                                  {session.duration && (
                                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                                      {formatDuration(session.duration)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600 mt-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600 mt-1" />
                            )}
                          </div>
                          
                          {/* Exercise list with timestamps */}
                          <div className="space-y-4 mt-4 border-t border-gray-800 pt-4">
                            {session.exercises?.map((ex, i) => {
                              // Calculate approximate time for each exercise based on workout duration
                              const exerciseDurationMs = session.duration 
                                ? (session.duration * 1000 / (session.exercises?.length || 1)) 
                                : DEFAULT_EXERCISE_DURATION_MS;
                              const exerciseTime = session.timestamp ? new Date(
                                session.timestamp.getTime() + (i * exerciseDurationMs)
                              ).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              }) : '--:--';

                              return (
                                <div key={i} className="flex gap-3">
                                  <span className="text-xs font-mono text-gray-600 w-12 shrink-0 pt-0.5">
                                    {exerciseTime}
                                  </span>
                                  <div className="flex-1">
                                    <div className="text-sm text-gray-300 font-medium mb-1">
                                      {i + 1}. {ex.name}
                                    </div>
                                    <div className="space-y-0.5">
                                      {ex.sets?.map((s, si) => (
                                        <div key={si} className="text-xs text-gray-500">
                                          Set {si + 1}: <span className="text-gray-400">{s.weight}kg × {s.reps}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-800 bg-gray-900/50 p-4 animate-in fade-in slide-in-from-top-2">
                            {session.note && (
                              <div className="bg-gray-800/50 p-3 rounded-lg mb-4">
                                <p className="text-xs text-gray-500 italic">"{session.note}"</p>
                              </div>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(session.id);
                              }}
                            >
                              Delete Session
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      ) : activeTab === 'calendar' ? (
        /* Task 4: Calendar View */
        <div className="p-6 pt-0 space-y-4">
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            markedDates={workoutDates}
            maxDate={new Date().toISOString().split('T')[0]}
          />

          {/* Selected Date Workouts */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-400">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <button
                  onClick={clearDateFilter}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Clear filter
                </button>
              </div>

              {filteredWorkouts.length === 0 ? (
                <Card hover={false} className="p-6 text-center">
                  <Dumbbell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No workouts on this date</p>
                </Card>
              ) : (
                filteredWorkouts.map((session) => {
                  const startTime = session.startTime;
                  return (
                    <Card key={session.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-200">{session.workoutName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {startTime && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeDisplay(startTime)}
                              </span>
                            )}
                            {session.duration && (
                              <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                                {formatDuration(session.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {session.exercises?.length || 0} exercises
                        </span>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {!selectedDate && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Select a date to view workouts</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 pt-0 space-y-4">
          {/* Search & Add */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input 
                placeholder="Search exercises..." 
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => setShowAddExercise(true)}
              icon={Plus}
              className="shrink-0"
            >
              Add
            </Button>
          </div>

          {/* Exercises List */}
          <div className="space-y-2">
            {loadingExercises ? (
              <div className="text-center py-8 text-gray-500">Loading exercises...</div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No exercises found</p>
                <Button variant="ghost" size="sm" onClick={() => setShowAddExercise(true)}>
                  Create "{searchQuery}"
                </Button>
              </div>
            ) : (
              filteredExercises.map((ex) => (
                <Card key={ex.id} className="p-4 flex items-center justify-between group">
                  <div>
                    <h3 className="font-bold text-gray-200">{ex.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">
                        {ex.muscle_group || 'Other'}
                      </span>
                      {ex.equipment && (
                        <span className="text-xs text-gray-600 capitalize">• {ex.equipment}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    icon={Play}
                    onClick={() => onStartQuickWorkout(ex)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Log
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Workout?"
        message="This action cannot be undone. Your workout data will be permanently removed."
        onConfirm={() => {
          onDelete(deleteConfirm);
          setDeleteConfirm(null);
          setExpandedId(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        title="Add Custom Exercise"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <Input
              value={newExercise.name}
              onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Bulgarian Split Squat"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Muscle Group</label>
            <select
              value={newExercise.muscle_group}
              onChange={(e) => setNewExercise(prev => ({ ...prev, muscle_group: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none"
            >
              <option value="">Select Muscle Group</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Legs">Legs</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Arms">Arms</option>
              <option value="Core">Core</option>
              <option value="Cardio">Cardio</option>
              <option value="Full Body">Full Body</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Equipment</label>
            <select
              value={newExercise.equipment}
              onChange={(e) => setNewExercise(prev => ({ ...prev, equipment: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-200 focus:border-emerald-500 outline-none"
            >
              <option value="">Select Equipment</option>
              <option value="Barbell">Barbell</option>
              <option value="Dumbbell">Dumbbell</option>
              <option value="Machine">Machine</option>
              <option value="Cable">Cable</option>
              <option value="Bodyweight">Bodyweight</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Button 
            onClick={handleCreateExercise} 
            loading={creatingExercise}
            disabled={!newExercise.name}
            className="w-full"
          >
            Create Exercise
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default HistoryView;

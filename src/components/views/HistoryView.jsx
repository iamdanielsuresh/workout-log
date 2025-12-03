import { useState, useEffect } from 'react';
import { 
  Dumbbell, ChevronDown, ChevronUp, Trash2, Search, 
  Plus, Filter, Play, History, List 
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { ViewHeader } from '../layout/Navigation';
import { getExercises, createExercise } from '../../services/supabase';

// Default exercise duration estimate (15 minutes in milliseconds)
const DEFAULT_EXERCISE_DURATION_MS = 15 * 60 * 1000;

/**
 * HistoryView - Workout history and Exercise Library
 */
export function HistoryView({ workouts, onBack, onDelete, onStartQuickWorkout, initialTab = 'history' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'history' | 'exercises'
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Exercises State
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle_group: '', equipment: '' });
  const [creatingExercise, setCreatingExercise] = useState(false);

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

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    return `${Math.floor(seconds / 60)} min`;
  };

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ViewHeader 
        title={activeTab === 'history' ? 'Workout History' : 'Exercise Library'} 
        subtitle={activeTab === 'history' 
          ? `${workouts.length} workout${workouts.length !== 1 ? 's' : ''} logged`
          : 'Browse and log exercises'
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
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'exercises' 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <List className="w-4 h-4" />
            My Exercises
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
              const dateKey = session.timestamp ? 
                session.timestamp.toISOString().split('T')[0] : 
                'Unknown Date';
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
                    const startTime = session.timestamp?.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    });

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

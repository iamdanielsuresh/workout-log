import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Dumbbell, ChevronDown, ChevronUp, Trash2, Search, 
  Plus, Filter, Play, History, List, Calendar as CalendarIcon, Clock,
  Download, PlusCircle, Check, X
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
 * SwipeableHistoryCard - Handles swipe-to-delete gesture for history items
 */
function SwipeableHistoryCard({ 
  workout, 
  isExpanded, 
  onToggleExpand, 
  onDelete,
  deleteConfirm,
  setDeleteConfirm,
  selectionMode,
  isSelected,
  onToggleSelection,
  onLongPress
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const longPressTimer = useRef(null);
  const threshold = -100;

  // Reset offset when expanded changes
  useEffect(() => {
    if (isExpanded) setOffset(0);
  }, [isExpanded]);

  const handleTouchStart = (e) => {
    if (selectionMode) return;
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(workout.id);
        setIsDragging(false); // Cancel drag
      }
    }, 500);

    if (isExpanded || deleteConfirm === workout.id) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = startX.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    // Cancel long press if moved significantly
    if (longPressTimer.current) {
      const moveX = Math.abs(e.touches[0].clientX - startX.current);
      const moveY = Math.abs(e.touches[0].clientY - startY.current);
      if (moveX > 10 || moveY > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (!isDragging || isExpanded || deleteConfirm === workout.id || selectionMode) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const diffX = x - startX.current;
    const diffY = y - startY.current;
    
    if (Math.abs(diffY) > Math.abs(diffX)) return;

    if (diffX < 0) {
      const resistance = 1 + Math.abs(diffX) / 600;
      setOffset(diffX / resistance);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isDragging) return;
    setIsDragging(false);

    if (offset < threshold) {
      setDeleteConfirm(workout.id);
      setOffset(0);
    } else {
      setOffset(0);
    }
  };

  const handleClick = (e) => {
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelection(workout.id);
    }
  };

  const startTime = workout.startTime 
    ? new Date(workout.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : (workout.timestamp ? new Date(workout.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

  return (
    <div className="relative mb-3 select-none touch-pan-y">
      {/* Delete Background Layer */}
      <div className={`absolute inset-0 bg-red-500/20 rounded-2xl flex items-center justify-end px-6 transition-opacity duration-200 ${
        offset < 0 ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className={`flex items-center gap-2 text-red-400 font-bold transition-transform duration-200 ${
          offset < threshold ? 'scale-110' : 'scale-100'
        }`}>
          <span>Delete</span>
          <Trash2 className="w-5 h-5" />
        </div>
      </div>

      {/* Card Layer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{ transform: `translateX(${offset}px)` }}
        className={`
          relative bg-gray-900 rounded-2xl border transition-all duration-200 overflow-hidden
          ${isSelected 
            ? 'border-emerald-500/50 bg-emerald-500/5' 
            : 'border-white/5 active:scale-[0.99]'}
        `}
      >
        <div 
          className="p-4 cursor-pointer"
          onClick={(e) => {
            if (selectionMode) {
              handleClick(e);
            } else {
              onToggleExpand();
            }
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              {selectionMode ? (
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                  ${isSelected 
                    ? 'bg-emerald-500 border-emerald-500' 
                    : 'border-gray-600 bg-transparent'}
                `}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              ) : (
                <span className="text-sm font-mono text-gray-500">{startTime}</span>
              )}
              <div>
                <h3 className="font-display font-bold text-lg text-gray-200 tracking-tight">{workout.workoutName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {workout.exercises?.length || 0} exercises
                  </span>
                  {workout.duration && (
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">
                      {formatDuration(workout.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {selectionMode ? null : (
              isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600 mt-1" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600 mt-1" />
              )
            )}
          </div>
          
          {/* Exercise list preview */}
          <div className="space-y-4 mt-4 border-t border-gray-800 pt-4">
            {workout.exercises?.map((ex, i) => {
               // Calculate approximate time for each exercise based on workout duration
               const exerciseDurationMs = workout.duration 
               ? (workout.duration * 1000 / (workout.exercises?.length || 1)) 
               : DEFAULT_EXERCISE_DURATION_MS;
             const exerciseTime = workout.timestamp ? new Date(
               new Date(workout.timestamp).getTime() + (i * exerciseDurationMs)
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

        {isExpanded && !selectionMode && (
          <div className="border-t border-gray-800 bg-gray-900/50 p-4 animate-in fade-in slide-in-from-top-2">
            {workout.note && (
              <div className="bg-gray-800/50 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-500 italic">"{workout.note}"</p>
              </div>
            )}
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(workout.id);
              }}
            >
              Delete Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  
  // Selection Mode State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
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

  // Selection Handlers
  const handleLongPress = (id) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([id]));
      // Vibrate if available
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleBulkDelete = () => {
    setDeleteConfirm({
      ids: Array.from(selectedIds),
      count: selectedIds.size
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm?.ids) {
      // Bulk delete
      deleteConfirm.ids.forEach(id => onDelete(id));
      setSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      // Single delete
      onDelete(deleteConfirm);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="pb-nav max-w-lg mx-auto min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Selection Header */}
      {selectionMode ? (
        <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold text-white">{selectedIds.size} selected</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
          >
            Delete
          </Button>
        </div>
      ) : (
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
      )}

      {/* Tabs */}
      {!selectionMode && (
        <div className="px-6 mb-6 mt-4">
          <div className="flex p-1 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'history' 
                  ? 'bg-gray-800 text-white shadow-lg ring-1 ring-white/10' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'calendar' 
                  ? 'bg-gray-800 text-white shadow-lg ring-1 ring-white/10' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'exercises' 
                  ? 'bg-gray-800 text-white shadow-lg ring-1 ring-white/10' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <List className="w-4 h-4" />
              Exercises
            </button>
          </div>
        </div>
      )}

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
                  {groupedByDate[dateKey].map((session) => (
                    <SwipeableHistoryCard
                      key={session.id}
                      workout={session}
                      isExpanded={expandedId === session.id}
                      onToggleExpand={() => setExpandedId(expandedId === session.id ? null : session.id)}
                      onDelete={onDelete}
                      deleteConfirm={deleteConfirm}
                      setDeleteConfirm={setDeleteConfirm}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(session.id)}
                      onToggleSelection={toggleSelection}
                      onLongPress={handleLongPress}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      ) : activeTab === 'calendar' ? (
        /* Task 4: Calendar View */
        <div className="p-6 pt-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  Clear Filter
                </button>
              </div>
              
              {filteredWorkouts.length > 0 ? (
                filteredWorkouts.map(session => (
                  <SwipeableHistoryCard
                    key={session.id}
                    workout={session}
                    isExpanded={expandedId === session.id}
                    onToggleExpand={() => setExpandedId(expandedId === session.id ? null : session.id)}
                    onDelete={onDelete}
                    deleteConfirm={deleteConfirm}
                    setDeleteConfirm={setDeleteConfirm}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(session.id)}
                    onToggleSelection={toggleSelection}
                    onLongPress={handleLongPress}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No workouts on this date
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Exercise Library Tab */
        <div className="p-6 pt-0 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input 
                placeholder="Search exercises..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="secondary" 
              icon={Plus}
              onClick={() => setShowAddExercise(true)}
            >
              Add
            </Button>
          </div>

          {loadingExercises ? (
            <div className="text-center py-8 text-gray-500">Loading exercises...</div>
          ) : (
            <div className="space-y-2">
              {filteredExercises.map(ex => (
                <Card key={ex.id} hover={false} className="p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-200">{ex.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{ex.muscle_group} • {ex.equipment}</div>
                  </div>
                </Card>
              ))}
              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No exercises found. Add one to get started!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.ids ? `Delete ${deleteConfirm.count} Workouts?` : "Delete Workout?"}
        message={deleteConfirm?.ids 
          ? "Are you sure you want to delete these workouts? This action cannot be undone."
          : "Are you sure you want to delete this workout? This action cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        isDestructive
      />

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        title="Create New Exercise"
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            value={newExercise.name}
            onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Bench Press"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Muscle Group</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={newExercise.muscle_group}
              onChange={(e) => setNewExercise(prev => ({ ...prev, muscle_group: e.target.value }))}
            >
              <option value="">Select Muscle Group</option>
              <option value="chest">Chest</option>
              <option value="back">Back</option>
              <option value="legs">Legs</option>
              <option value="shoulders">Shoulders</option>
              <option value="arms">Arms</option>
              <option value="core">Core</option>
              <option value="cardio">Cardio</option>
              <option value="full_body">Full Body</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Equipment</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={newExercise.equipment}
              onChange={(e) => setNewExercise(prev => ({ ...prev, equipment: e.target.value }))}
            >
              <option value="">Select Equipment</option>
              <option value="barbell">Barbell</option>
              <option value="dumbbell">Dumbbell</option>
              <option value="machine">Machine</option>
              <option value="cable">Cable</option>
              <option value="bodyweight">Bodyweight</option>
              <option value="kettlebell">Kettlebell</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setShowAddExercise(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleCreateExercise}
              disabled={!newExercise.name || creatingExercise}
            >
              {creatingExercise ? 'Creating...' : 'Create Exercise'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default HistoryView;

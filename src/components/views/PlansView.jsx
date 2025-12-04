import { useState, useRef, useEffect } from 'react';
import { 
  Dumbbell, ChevronRight, Clock, Plus, Edit3, 
  Trash2, MoreVertical, Check, X, Sparkles, Target,
  ChevronDown, ChevronUp, Info, Lightbulb, AlertCircle,
  Folder, FolderPlus, FolderOpen, Layers, Flame, Activity
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { ViewHeader } from '../layout/Navigation';

/**
 * FolderCard - Displays a folder of workout plans
 */
function FolderCard({ 
  folder, 
  plans, 
  index,
  isExpanded, 
  onToggle, 
  selectionMode,
  selectedPlans,
  onSelectPlan,
  onDeleteFolder,
  children 
}) {
  const planCount = plans.length;
  const selectedCount = plans.filter(p => selectedPlans.has(p.id)).length;
  const isAllSelected = planCount > 0 && selectedCount === planCount;

  const handleFolderSelect = (e) => {
    e.stopPropagation();
    // Toggle all plans in folder
    plans.forEach(plan => {
      onSelectPlan(plan.id, !isAllSelected);
    });
  };

  return (
    <div 
      className="mb-3 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-500"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div 
        className={`
          relative overflow-hidden rounded-2xl transition-all duration-200
          ${isExpanded ? 'bg-gray-800/80 ring-1 ring-white/10' : 'bg-gray-900/50 border border-white/5'}
        `}
      >
        <div 
          className="p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={onToggle}
        >
          {/* Icon */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center transition-colors
            ${isExpanded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}
          `}>
            {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-medium text-gray-200 truncate">{folder.name}</h3>
            <p className="text-xs text-gray-500">
              {planCount} routine{planCount !== 1 ? 's' : ''}
              {selectionMode && selectedCount > 0 && (
                <span className="text-emerald-400 ml-2">
                  • {selectedCount} selected
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <div 
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                  ${isAllSelected 
                    ? 'bg-emerald-500 border-emerald-500' 
                    : 'border-gray-600 bg-transparent'}
                `}
                onClick={handleFolderSelect}
              >
                {isAllSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            ) : (
              <ChevronRight 
                className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 pl-4 space-y-3 border-l-2 border-gray-800 ml-4 animate-in slide-in-from-top-2 duration-200">
          {children}
          
          {!selectionMode && (
            <button 
              onClick={() => onDeleteFolder(folder.id)}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete Folder
            </button>
          )}
        </div>
      )}
    </div>
  );
}


/**
 * SwipeablePlanCard - Handles swipe-to-delete gesture
 */
function SwipeablePlanCard({ 
  plan, 
  index, 
  isExpanded, 
  onToggleExpand, 
  onSelect, 
  onEdit, 
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
  const isAiGenerated = plan.source === 'ai-generated';
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
        onLongPress(plan.id);
        setIsDragging(false); // Cancel drag
      }
    }, 500);

    if (isExpanded || deleteConfirm === plan.id) return;
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

    if (!isDragging || isExpanded || deleteConfirm === plan.id || selectionMode) return;
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
      setDeleteConfirm(plan.id);
      setOffset(0);
    } else {
      setOffset(0);
    }
  };

  const handleClick = (e) => {
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelection(plan.id);
    } else if (deleteConfirm === plan.id) {
      // Do nothing, let the delete button handle it
    } else {
      // onSelect(plan.id); // Don't select here, let the expand button do it or the start button
    }
  };

  return (
    <div 
      className="relative mb-3 select-none touch-pan-y animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-500"
      style={{ animationDelay: `${index * 50}ms` }}
    >
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
          relative bg-gray-900 rounded-2xl border transition-all duration-200
          ${isSelected 
            ? 'border-emerald-500/50 bg-emerald-500/5' 
            : 'border-white/5 active:scale-[0.99]'}
          ${deleteConfirm === plan.id ? 'translate-x-[-100%]' : ''}
        `}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-display font-bold text-lg truncate ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                  {plan.name}
                </h3>
                {isAiGenerated && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{plan.estTime || plan.duration || '45 min'}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-700" />
                <span>{plan.exercises?.length || 0} exercises</span>
              </div>
            </div>

            {selectionMode ? (
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-1
                ${isSelected 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-gray-600 bg-transparent'}
              `}>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(plan.id);
                  }}
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                  }}
                >
                  <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </Button>
              </div>
            )}
          </div>

          {/* Exercises Preview (Collapsed) */}
          {!isExpanded && (
            <div className="mt-3 space-y-1">
              {plan.exercises?.slice(0, 2).map((ex, i) => (
                <div key={i} className="text-sm text-gray-400 truncate flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-500/50 shrink-0" />
                  <span className="truncate">{ex.name}</span>
                </div>
              ))}
              {(plan.exercises?.length || 0) > 2 && (
                <div className="text-xs text-gray-600 pl-3">
                  +{plan.exercises.length - 2} more exercises
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && !selectionMode && (
          <div className="border-t border-gray-800 bg-gray-900/50 p-4 animate-in fade-in slide-in-from-top-2">
             {/* Day tip for AI-generated plans */}
             {plan.dayTip && (
                <div className="flex items-start gap-2 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 mb-4">
                  <Lightbulb className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-purple-300">{plan.dayTip}</p>
                </div>
              )}

              {/* Description */}
              {plan.desc && (
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
              )}

              {/* Warmup Section */}
              {plan.warmup && plan.warmup.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    Warm Up
                  </h4>
                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl overflow-hidden">
                    {plan.warmup.map((w, i) => (
                      <div key={i} className="flex items-center justify-between p-2 border-b border-orange-500/10 last:border-0">
                        <span className="text-xs text-gray-300">{w.name}</span>
                        <span className="text-xs font-mono text-orange-400/80">{w.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises list with tips */}
              <div className="space-y-2 mb-4">
                {plan.exercises?.map((ex, i) => (
                  <ExercisePreviewCard key={i} exercise={ex} isAiGenerated={isAiGenerated} />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onSelect(plan.id)}
                  className="flex-1"
                  icon={Dumbbell}
                >
                  Start Workout
                </Button>
                {deleteConfirm === plan.id ? (
                  <div className="flex gap-1">
                    <Button
                      variant="danger"
                      onClick={() => {
                        onDelete?.(plan.id);
                        setDeleteConfirm(null);
                        onToggleExpand(); // Close after delete
                      }}
                      icon={Check}
                      className="px-3"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => setDeleteConfirm(null)}
                      icon={X}
                      className="px-3"
                    />
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteConfirm(plan.id)}
                    icon={Trash2}
                    className="px-4 text-gray-500 hover:text-red-400"
                  />
                )}
              </div>
          </div>
        )}

        {/* Delete Confirmation Overlay */}
        {deleteConfirm === plan.id && (
          <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 z-10 animate-in fade-in duration-200">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="bg-red-500 hover:bg-red-600 text-white border-none"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(plan.id);
                setDeleteConfirm(null);
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}



/**
 * PlansView - Manage workout plans/routines
 * View, edit, reorder, and manage workout plans
 */
export function PlansView({ 
  plans, 
  folders = {},
  createFolder,
  deleteFolder,
  movePlansToFolder,
  deletePlans,
  onSelectPlan, 
  onEditPlan,
  onDeletePlan,
  onCreatePlan
}) {
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Selection Mode State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState(new Set());
  
  // Folder State
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);

  const plansList = Object.values(plans || {});
  const foldersList = Object.values(folders || {});

  // Group plans by folder
  const uncategorizedPlans = plansList.filter(p => !p.folderId);
  const plansByFolder = {};
  foldersList.forEach(folder => {
    plansByFolder[folder.id] = plansList.filter(p => p.folderId === folder.id);
  });

  // Selection Handlers
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedPlans);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPlans(newSelected);
  };

  const handleLongPress = (id) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedPlans(new Set([id]));
      // Haptic feedback if available
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedPlans(new Set());
  };

  const handleSelectAll = () => {
    if (selectedPlans.size === plansList.length) {
      setSelectedPlans(new Set());
    } else {
      setSelectedPlans(new Set(plansList.map(p => p.id)));
    }
  };

  // Folder Handlers
  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName);
    setNewFolderName('');
    setShowCreateFolder(false);
  };

  const handleMoveSelected = async (folderId) => {
    await movePlansToFolder(Array.from(selectedPlans), folderId);
    exitSelectionMode();
    setShowMoveModal(false);
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Delete ${selectedPlans.size} plans?`)) {
      await deletePlans(Array.from(selectedPlans));
      exitSelectionMode();
    }
  };

  // Calculate stats
  const uniqueExercises = new Set();
  plansList.forEach(plan => {
    plan.exercises?.forEach(ex => {
      if (ex.name) uniqueExercises.add(ex.name.toLowerCase().trim());
    });
  });
  const aiPlanCount = plansList.filter(p => p.source === 'ai-generated').length;

  return (
    <div className="min-h-screen pb-nav animate-in fade-in slide-in-from-bottom-4 duration-500 select-none">
      <ViewHeader 
        title={selectionMode ? `${selectedPlans.size} Selected` : "Workout Plans"}
        subtitle={selectionMode ? null : `${plansList.length} routine${plansList.length !== 1 ? 's' : ''}`}
        rightAction={selectionMode ? (
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            {selectedPlans.size === plansList.length ? 'Deselect All' : 'Select All'}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowCreateFolder(true)}>
            <FolderPlus className="w-5 h-5" />
          </Button>
        )}
      />

      <div className="p-6 max-w-lg mx-auto space-y-4 pb-24">
        {/* Quick Stats (Hide in selection mode) */}
        {!selectionMode && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-white/5 shadow-lg shadow-black/20 animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-backwards">
              <p className="text-3xl font-display font-bold text-emerald-400">{plansList.length}</p>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Routines</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-white/5 shadow-lg shadow-black/20 animate-in fade-in zoom-in-95 duration-500 delay-200 fill-mode-backwards">
              <p className="text-3xl font-display font-bold text-blue-400">{uniqueExercises.size}</p>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Exercises</p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-white/5 shadow-lg shadow-black/20 animate-in fade-in zoom-in-95 duration-500 delay-300 fill-mode-backwards">
              <p className="text-3xl font-display font-bold text-amber-400">{aiPlanCount}</p>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">AI Plans</p>
            </div>
          </div>
        )}

        {/* Folders */}
        {foldersList.map((folder, index) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            index={index}
            plans={plansByFolder[folder.id] || []}
            isExpanded={expandedFolders.has(folder.id)}
            onToggle={() => toggleFolder(folder.id)}
            selectionMode={selectionMode}
            selectedPlans={selectedPlans}
            onSelectPlan={(id, selected) => {
              const newSelected = new Set(selectedPlans);
              if (selected) newSelected.add(id);
              else newSelected.delete(id);
              setSelectedPlans(newSelected);
            }}
            onDeleteFolder={deleteFolder}
          >
            {(plansByFolder[folder.id] || []).map((plan, index) => (
              <SwipeablePlanCard
                key={plan.id}
                plan={plan}
                index={index}
                isExpanded={expandedPlan === plan.id}
                onToggleExpand={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                onSelect={onSelectPlan}
                onEdit={onEditPlan}
                onDelete={onDeletePlan}
                deleteConfirm={deleteConfirm}
                setDeleteConfirm={setDeleteConfirm}
                selectionMode={selectionMode}
                isSelected={selectedPlans.has(plan.id)}
                onToggleSelection={toggleSelection}
                onLongPress={handleLongPress}
              />
            ))}
          </FolderCard>
        ))}

        {/* Uncategorized Plans */}
        <div className="space-y-3">
          {uncategorizedPlans.length === 0 && foldersList.length === 0 ? (
            <Card hover={false} className="p-8 text-center animate-in fade-in zoom-in-95 duration-500 delay-300">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-display font-bold text-xl text-gray-400 mb-2">No workout plans</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create your first workout routine to get started
              </p>
              <Button onClick={onCreatePlan} icon={Plus}>
                Create Plan
              </Button>
            </Card>
          ) : (
            uncategorizedPlans.map((plan, index) => (
              <SwipeablePlanCard
                key={plan.id}
                plan={plan}
                index={index + (foldersList.length * 2)}
                isExpanded={expandedPlan === plan.id}
                onToggleExpand={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                onSelect={onSelectPlan}
                onEdit={onEditPlan}
                onDelete={onDeletePlan}
                deleteConfirm={deleteConfirm}
                setDeleteConfirm={setDeleteConfirm}
                selectionMode={selectionMode}
                isSelected={selectedPlans.has(plan.id)}
                onToggleSelection={toggleSelection}
                onLongPress={handleLongPress}
              />
            ))
          )}
        </div>

        {/* Add new plan button (Hide in selection mode) */}
        {!selectionMode && plansList.length > 0 && (
          <Button
            variant="secondary"
            className="w-full mt-4"
            icon={Plus}
            onClick={onCreatePlan}
          >
            Add New Routine
          </Button>
        )}
      </div>

      {/* Selection Mode Action Bar */}
      {selectionMode && (
        <div className="fixed bottom-20 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-10">
          <div className="max-w-lg mx-auto bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={exitSelectionMode}
            >
              Cancel
            </Button>
            <div className="w-px h-8 bg-gray-800" />
            <Button 
              variant="ghost"
              className="flex-1 text-gray-300 hover:text-white"
              onClick={() => setShowMoveModal(true)}
              disabled={selectedPlans.size === 0}
            >
              <Folder className="w-4 h-4 mr-2" />
              Move
            </Button>
            <Button 
              variant="danger"
              className="flex-1"
              onClick={handleDeleteSelected}
              disabled={selectedPlans.size === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedPlans.size})
            </Button>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      <Modal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        title="Create Folder"
      >
        <div className="space-y-4">
          <Input
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="e.g., Strength, Cardio, Home"
            autoFocus
          />
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              className="flex-1" 
              onClick={() => setShowCreateFolder(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move to Folder Modal */}
      <Modal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        title="Move to Folder"
      >
        <div className="space-y-2">
          <button
            onClick={() => handleMoveSelected(null)}
            className="w-full p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-left transition-colors flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
              <Layers className="w-5 h-5 text-gray-400" />
            </div>
            <span className="font-medium">Uncategorized</span>
          </button>

          {foldersList.map(folder => (
            <button
              key={folder.id}
              onClick={() => handleMoveSelected(folder.id)}
              className="w-full p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 text-left transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                <Folder className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-medium">{folder.name}</span>
            </button>
          ))}
          
          <button
            onClick={() => {
              setShowMoveModal(false);
              setShowCreateFolder(true);
            }}
            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-700 hover:border-gray-600 text-gray-500 hover:text-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Folder
          </button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * ExercisePreviewCard - Displays exercise details in expanded view
 */
function ExercisePreviewCard({ exercise, isAiGenerated }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetailedTips = exercise.tips && (exercise.tips.form || exercise.tips.cues || exercise.tips.mistakes);
  const quickTip = exercise.tip || (exercise.tips && exercise.tips.goal);

  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden">
      {/* Exercise Row - Clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-200 font-medium text-sm truncate">{exercise.name}</span>
            {exercise.replacedFrom && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded shrink-0">
                swapped
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{exercise.sets} × {exercise.range || exercise.reps}</span>
            {exercise.rpe && (
              <>
                <span className="text-gray-700">•</span>
                <span className="text-xs text-amber-500/80">RPE {exercise.rpe}</span>
              </>
            )}
            {exercise.muscleGroup && (
              <>
                <span className="text-gray-700">•</span>
                <span className="text-xs text-gray-600 truncate">{exercise.muscleGroup}</span>
              </>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-600 shrink-0 ml-2" />
        ) : (
          <Info className="w-4 h-4 text-gray-600 shrink-0 ml-2" />
        )}
      </button>

      {/* Expanded Exercise Details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {exercise.tempo && (
              <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                  <Activity className="w-3 h-3" />
                  <span className="text-[10px] uppercase">Tempo</span>
                </div>
                <span className="text-xs font-mono text-gray-300">{exercise.tempo}</span>
              </div>
            )}
            {exercise.rest && (
              <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] uppercase">Rest</span>
                </div>
                <span className="text-xs font-mono text-gray-300">{exercise.rest}</span>
              </div>
            )}
          </div>

          {/* Tips */}
          {quickTip && (
            <div className="flex items-start gap-2 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
              <Target className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-400">{quickTip}</p>
            </div>
          )}

          {hasDetailedTips && (
            <div className="space-y-2 pt-1">
              {exercise.tips.form && (
                <div className="text-xs text-gray-500">
                  <span className="text-emerald-400 font-medium">Form: </span>
                  {exercise.tips.form}
                </div>
              )}
              {exercise.tips.mistakes && exercise.tips.mistakes.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="text-red-400 font-medium">Avoid: </span>
                  {exercise.tips.mistakes[0]}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default PlansView;

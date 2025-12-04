import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { DEFAULT_WORKOUT_PLANS } from '../constants/defaults';
import { createLogger } from '../utils/logger';

const log = createLogger('useWorkoutPlans');

/**
 * Hook for managing user's workout plans
 */
export function useWorkoutPlans(userId) {
  const [plans, setPlans] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch plans and folders when userId changes
  useEffect(() => {
    if (!userId) {
      setPlans(null);
      setFolders([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      log.log('Fetching plans and folders for user:', userId);
      setError(null);
      
      try {
        // Fetch folders
        const { data: foldersData, error: foldersError } = await supabase
          .from('workout_folders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (foldersError) throw foldersError;
        setFolders(foldersData || []);

        // Fetch plans
        const { data, error: fetchError } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (fetchError) throw fetchError;
        
        if (data && data.length > 0) {
          log.log('Fetched plans:', data);
          // Convert array to object keyed by plan_id
          const plansObj = {};
          data.forEach(plan => {
            plansObj[plan.plan_id] = {
              id: plan.plan_id,
              name: plan.name,
              desc: plan.description,
              next: plan.next_plan,
              estTime: plan.est_time,
              exercises: plan.exercises || [],
              source: plan.source,
              dbId: plan.id,
              folderId: plan.folder_id
            };
          });
          setPlans(plansObj);
        } else {
          log.log('No plans found');
          setPlans(null);
        }
      } catch (err) {
        log.error('Error fetching workout data:', err);
        // Don't show error for missing table (if migration hasn't run)
        if (err.code === '42P01') { // undefined_table
          log.warn('Folders table not found, skipping folder features');
        } else {
          setError(err.message || 'Failed to load workout plans');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Create a new folder
  const createFolder = useCallback(async (name, color = 'emerald') => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('workout_folders')
        .insert({ user_id: userId, name, color })
        .select()
        .single();

      if (error) throw error;
      
      setFolders(prev => [data, ...prev]);
      return data;
    } catch (err) {
      log.error('Error creating folder:', err);
      throw err;
    }
  }, [userId]);

  // Delete a folder
  const deleteFolder = useCallback(async (folderId) => {
    if (!userId) return;

    try {
      // First update plans to remove folder_id (handled by DB ON DELETE SET NULL usually, but good to be safe)
      // Actually DB handles it.
      
      const { error } = await supabase
        .from('workout_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', userId);

      if (error) throw error;

      setFolders(prev => prev.filter(f => f.id !== folderId));
      
      // Update local plans to remove folderId
      setPlans(prev => {
        if (!prev) return null;
        const newPlans = { ...prev };
        Object.keys(newPlans).forEach(key => {
          if (newPlans[key].folderId === folderId) {
            newPlans[key] = { ...newPlans[key], folderId: null };
          }
        });
        return newPlans;
      });
    } catch (err) {
      log.error('Error deleting folder:', err);
      throw err;
    }
  }, [userId]);

  // Move plans to a folder
  const movePlansToFolder = useCallback(async (planIds, folderId) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('workout_plans')
        .update({ folder_id: folderId })
        .in('plan_id', planIds)
        .eq('user_id', userId);

      if (error) throw error;

      setPlans(prev => {
        if (!prev) return null;
        const newPlans = { ...prev };
        planIds.forEach(id => {
          if (newPlans[id]) {
            newPlans[id] = { ...newPlans[id], folderId };
          }
        });
        return newPlans;
      });
    } catch (err) {
      log.error('Error moving plans:', err);
      throw err;
    }
  }, [userId]);

  // Bulk delete plans
  const deletePlans = useCallback(async (planIds) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .in('plan_id', planIds)
        .eq('user_id', userId);

      if (error) throw error;

      setPlans(prev => {
        if (!prev) return null;
        const newPlans = { ...prev };
        planIds.forEach(id => delete newPlans[id]);
        return Object.keys(newPlans).length > 0 ? newPlans : null;
      });
    } catch (err) {
      log.error('Error deleting plans:', err);
      throw err;
    }
  }, [userId]);

  // Save multiple plans at once (used during onboarding)
  const savePlans = useCallback(async (plansData, source = 'template', templateId = null) => {
    if (!userId) {
      log.error('Cannot save - no user ID');
      throw new Error('No user ID available');
    }

    log.log('Saving plans for user:', userId, plansData);

    // Convert plans object to array for insertion
    const plansArray = Object.entries(plansData).map(([planId, plan], index) => ({
      user_id: userId,
      plan_id: planId,
      name: plan.name,
      description: plan.desc || plan.description || '',
      next_plan: plan.next,
      est_time: plan.estTime || plan.est_time || '45 min',
      exercises: plan.exercises || [],
      source,
      template_id: templateId,
      sort_order: index,
      is_active: true,
      folder_id: plan.folderId || plan.folder_id || null
    }));

    // Delete existing plans first
    const { error: deleteError } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      log.error('Error deleting existing plans:', deleteError);
    }

    // Insert new plans
    const { data, error } = await supabase
      .from('workout_plans')
      .insert(plansArray)
      .select();

    if (error) {
      log.error('Error saving workout plans:', error);
      throw error;
    }

    log.log('Plans saved successfully:', data);

    // Update local state
    const plansObj = {};
    data.forEach(plan => {
      plansObj[plan.plan_id] = {
        id: plan.plan_id,
        name: plan.name,
        desc: plan.description,
        next: plan.next_plan,
        estTime: plan.est_time,
        exercises: plan.exercises || [],
        source: plan.source,
        dbId: plan.id
      };
    });
    setPlans(plansObj);
    
    return data;
  }, [userId]);

  // Update a single plan
  const updatePlan = useCallback(async (planId, updates) => {
    if (!userId || !plans?.[planId]) {
      throw new Error('Plan not found');
    }

    const { data, error } = await supabase
      .from('workout_plans')
      .update({
        name: updates.name,
        description: updates.desc,
        exercises: updates.exercises,
        est_time: updates.estTime,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .select()
      .single();

    if (error) {
      log.error('Error updating plan:', error);
      throw error;
    }

    setPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        ...updates
      }
    }));

    return data;
  }, [userId, plans]);

  // Delete a plan
  const deletePlan = useCallback(async (planId) => {
    if (!userId) return;

    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', userId)
      .eq('plan_id', planId);

    if (error) {
      log.error('Error deleting plan:', error);
      throw error;
    }

    setPlans(prev => {
      const newPlans = { ...prev };
      delete newPlans[planId];
      return Object.keys(newPlans).length > 0 ? newPlans : null;
    });
  }, [userId]);

  // Get active plans (with fallback to defaults)
  const activePlans = plans || DEFAULT_WORKOUT_PLANS;
  const hasCustomPlans = !!plans;
  const plansList = Object.values(activePlans);

  return {
    plans: activePlans,
    rawPlans: plans,
    loading,
    error,
    savePlans,
    updatePlan,
    deletePlan,
    hasCustomPlans,
    plansList,
    folders,
    createFolder,
    deleteFolder,
    movePlansToFolder,
    deletePlans,
    clearError: () => setError(null),
  };
}

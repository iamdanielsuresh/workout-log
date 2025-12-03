import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { createLogger } from '../utils/logger';

const log = createLogger('useNotes');

/**
 * Hook for managing AI notes
 * Task 2: Save Notes from AI Chat
 */
export function useNotes(userId) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    if (!userId) return;

    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      const formattedNotes = data?.map(note => ({
        id: note.id,
        text: note.message_text,
        category: note.category,
        source: note.source,
        createdAt: new Date(note.created_at)
      })) || [];

      setNotes(formattedNotes);
    } catch (err) {
      log.error('Error fetching notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    fetchNotes();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('ai_notes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ai_notes', filter: `user_id=eq.${userId}` },
        () => fetchNotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotes]);

  // Save a note (instant, non-blocking)
  const saveNote = useCallback(async (messageText, category = 'chat', source = 'chat') => {
    if (!userId || !messageText) {
      throw new Error('User ID and message text are required');
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newNote = {
      id: tempId,
      text: messageText,
      category,
      source,
      createdAt: new Date()
    };
    
    setNotes(prev => [newNote, ...prev]);

    try {
      const { data, error } = await supabase
        .from('ai_notes')
        .insert({
          user_id: userId,
          message_text: messageText,
          category,
          source
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp note with real one
      setNotes(prev => prev.map(n => 
        n.id === tempId 
          ? { ...n, id: data.id }
          : n
      ));

      log.log('Note saved:', data.id);
      return data;
    } catch (err) {
      // Revert optimistic update on error
      setNotes(prev => prev.filter(n => n.id !== tempId));
      log.error('Error saving note:', err);
      throw err;
    }
  }, [userId]);

  // Delete a note
  const deleteNote = useCallback(async (noteId) => {
    if (!userId) throw new Error('No user ID');

    // Optimistic update
    const previousNotes = notes;
    setNotes(prev => prev.filter(n => n.id !== noteId));

    try {
      const { error } = await supabase
        .from('ai_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) throw error;
      log.log('Note deleted:', noteId);
    } catch (err) {
      // Revert on error
      setNotes(previousNotes);
      log.error('Error deleting note:', err);
      throw err;
    }
  }, [userId, notes]);

  // Search and filter notes
  const searchNotes = useCallback((query, categoryFilter = null) => {
    let filtered = notes;
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(note => 
        note.text.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(note => note.category === categoryFilter);
    }
    
    return filtered;
  }, [notes]);

  // Get notes by category
  const getNotesByCategory = useCallback((category) => {
    return notes.filter(note => note.category === category);
  }, [notes]);

  return {
    notes,
    loading,
    error,
    saveNote,
    deleteNote,
    searchNotes,
    getNotesByCategory,
    refresh: fetchNotes,
    clearError: () => setError(null)
  };
}

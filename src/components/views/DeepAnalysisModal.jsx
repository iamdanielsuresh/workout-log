import React, { useState, useEffect } from 'react';
import { Activity, Brain } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { generateDeepAnalysis } from '../../services/ai';
import { useProfile } from '../../hooks/useProfile';
import { useAI } from '../../hooks/useAI';

export default function DeepAnalysisModal({ isOpen, onClose, persona, workouts }) {
  const { profile } = useProfile();
  const { apiKey } = useAI();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleStartAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateDeepAnalysis(apiKey, workouts, persona, profile);
      setReport(result);
    } catch (err) {
      setError('Failed to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !report && !loading) {
      // Optional: Auto-start or wait for user?
    }
  }, [isOpen]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-gray-400 animate-pulse">
            {persona.name === 'Drill Sgt' ? 'GATHERING INTEL...' : 
             persona.name === 'Prof. Lift' ? 'ANALYZING DATA...' : 
             'Thinking deeply...'}
          </p>
        </div>
      );
    }

    if (report) {
      return (
        <div className="prose prose-invert max-w-none space-y-4">
          {report.split('\n').map((line, i) => {
            // Simple markdown parsing
            let content = line;
            let className = "text-gray-300 whitespace-pre-wrap";
            
            if (line.startsWith('## ')) {
              content = line.replace('## ', '');
              className = "text-xl font-bold text-emerald-400 mt-6 mb-2";
              return <h3 key={i} className={className}>{content}</h3>;
            }
            if (line.startsWith('### ')) {
                content = line.replace('### ', '');
                className = "text-lg font-semibold text-white mt-4 mb-1";
                return <h4 key={i} className={className}>{content}</h4>;
            }
            if (line.trim().startsWith('- ')) {
              content = line.replace('- ', '');
              return <li key={i} className="ml-4 text-gray-300 list-disc">{content}</li>;
            }
            
            // Bold text handling (simple)
            const parts = line.split('**');
            if (parts.length > 1) {
                return (
                    <p key={i} className={className}>
                        {parts.map((part, idx) => 
                            idx % 2 === 1 ? <strong key={idx} className="text-white font-semibold">{part}</strong> : part
                        )}
                    </p>
                );
            }

            return <p key={i} className={className}>{line}</p>;
          })}
        </div>
      );
    }

    return (
      <div className="text-center py-8 space-y-6">
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          <Brain className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {persona.name === 'Drill Sgt' ? 'ENTER THE WAR ROOM' : 
             persona.name === 'Prof. Lift' ? 'ENTER THE LAB' : 
             'Deep Dive Analysis'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            This will analyze your entire workout history to find trends, plateaus, and opportunities. 
            It uses advanced processing and may take up to 30 seconds.
          </p>
          <Button onClick={handleStartAnalysis} className="w-full">
            Start Analysis
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={persona.name === 'Drill Sgt' ? 'WAR ROOM' : persona.name === 'Prof. Lift' ? 'LAB ANALYSIS' : 'Deep Analysis'}
      size="lg"
    >
      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
        {renderContent()}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

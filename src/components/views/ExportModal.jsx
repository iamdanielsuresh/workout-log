import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { formatDuration } from '../../utils/localeFormatters';

/**
 * Export Modal - Export workouts as PDF or CSV
 * Task 8: Export Workouts
 */
export function ExportModal({ 
  isOpen, 
  onClose, 
  workouts,
  onToast
}) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const getFilteredWorkouts = () => {
    let filtered = [...workouts];
    const now = new Date();

    switch (dateRange) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(w => new Date(w.timestamp) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(w => new Date(w.timestamp) >= monthAgo);
        break;
      case '3months':
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(w => new Date(w.timestamp) >= threeMonthsAgo);
        break;
      case 'custom':
        if (customStartDate) {
          const start = new Date(customStartDate);
          filtered = filtered.filter(w => new Date(w.timestamp) >= start);
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          filtered = filtered.filter(w => new Date(w.timestamp) <= end);
        }
        break;
      default:
        break;
    }

    return filtered;
  };

  const exportCSV = () => {
    const filtered = getFilteredWorkouts();
    
    // Create CSV headers
    const headers = ['Date', 'Time', 'Workout Name', 'Duration (min)', 'Exercise', 'Sets', 'Reps', 'Weight (kg)', 'Notes'];
    
    // Create CSV rows
    const rows = [];
    filtered.forEach(workout => {
      const date = new Date(workout.timestamp);
      const dateStr = date.toLocaleDateString('en-US');
      const timeStr = workout.startTime ? new Date(workout.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      const durationMin = workout.duration ? Math.round(workout.duration / 60) : '';
      
      if (workout.exercises && workout.exercises.length > 0) {
        workout.exercises.forEach((ex, exIndex) => {
          if (ex.sets && ex.sets.length > 0) {
            ex.sets.forEach((set, setIndex) => {
              rows.push([
                exIndex === 0 && setIndex === 0 ? dateStr : '',
                exIndex === 0 && setIndex === 0 ? timeStr : '',
                exIndex === 0 && setIndex === 0 ? workout.workoutName : '',
                exIndex === 0 && setIndex === 0 ? durationMin : '',
                setIndex === 0 ? ex.name : '',
                `Set ${setIndex + 1}`,
                set.reps || '',
                set.weight || '',
                exIndex === 0 && setIndex === 0 ? (workout.note || '') : ''
              ]);
            });
          } else {
            rows.push([
              exIndex === 0 ? dateStr : '',
              exIndex === 0 ? timeStr : '',
              exIndex === 0 ? workout.workoutName : '',
              exIndex === 0 ? durationMin : '',
              ex.name,
              '',
              '',
              '',
              exIndex === 0 ? (workout.note || '') : ''
            ]);
          }
        });
      } else {
        rows.push([dateStr, timeStr, workout.workoutName, durationMin, '', '', '', '', workout.note || '']);
      }
    });

    // Generate CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `workout-log-${getDateRangeLabel()}.csv`);
  };

  const exportPDF = async () => {
    const filtered = getFilteredWorkouts();
    
    // Dynamically import jsPDF with error handling
    let jsPDF, doc;
    try {
      const jspdfModule = await import('jspdf');
      jsPDF = jspdfModule.jsPDF;
      await import('jspdf-autotable');
      doc = new jsPDF();
    } catch (err) {
      console.error('Failed to load PDF library:', err);
      throw new Error('PDF export is not available. Please try again later.');
    }
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // Emerald color
    doc.text('Workout Log', 105, 20, { align: 'center' });
    
    // Subtitle with date range
    doc.setFontSize(12);
    doc.setTextColor(128, 128, 128);
    doc.text(`Export: ${getDateRangeLabel()}`, 105, 30, { align: 'center' });
    
    // Summary stats
    const totalWorkouts = filtered.length;
    const totalDuration = filtered.reduce((sum, w) => sum + (w.duration || 0), 0);
    const totalExercises = filtered.reduce((sum, w) => sum + (w.exercises?.length || 0), 0);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Workouts: ${totalWorkouts}  |  Total Time: ${formatDuration(totalDuration)}  |  Total Exercises: ${totalExercises}`, 105, 40, { align: 'center' });
    
    // Workout details
    let yPos = 55;
    
    filtered.forEach((workout, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      const date = new Date(workout.timestamp);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = workout.startTime ? new Date(workout.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      
      // Workout header
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(`${workout.workoutName}`, 14, yPos);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const metaText = [dateStr, timeStr, workout.duration ? formatDuration(workout.duration) : ''].filter(Boolean).join(' • ');
      doc.text(metaText, 14, yPos + 5);
      
      yPos += 12;
      
      // Exercises table
      if (workout.exercises && workout.exercises.length > 0) {
        const tableData = workout.exercises.map(ex => {
          const setsInfo = ex.sets?.map((s, i) => `${s.weight || 0}kg×${s.reps || 0}`).join(', ') || '-';
          return [ex.name, ex.sets?.length || 0, setsInfo];
        });
        
        doc.autoTable({
          startY: yPos,
          head: [['Exercise', 'Sets', 'Weight × Reps']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 'auto' }
          },
          margin: { left: 14, right: 14 }
        });
        
        yPos = doc.lastAutoTable.finalY + 5;
      }
      
      // Note
      if (workout.note) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Note: ${workout.note}`, 14, yPos);
        yPos += 5;
      }
      
      yPos += 10;
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by WorkoutLog • Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Download
    doc.save(`workout-log-${getDateRangeLabel()}.pdf`);
  };

  const downloadBlob = (blob, filename) => {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Some browsers require the link to be in the DOM
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback for browsers that don't support programmatic downloads
      console.error('Download failed:', err);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'week': return 'last-7-days';
      case 'month': return 'last-30-days';
      case '3months': return 'last-90-days';
      case 'custom': return `${customStartDate || 'start'}-to-${customEndDate || 'end'}`;
      default: return 'all-time';
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      if (exportFormat === 'csv') {
        exportCSV();
      } else {
        await exportPDF();
      }
      onToast?.({ message: `Exported as ${exportFormat.toUpperCase()}!`, type: 'success' });
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      onToast?.({ message: 'Export failed. Please try again.', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const filteredCount = getFilteredWorkouts().length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Workouts">
      <div className="space-y-5">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Export Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setExportFormat('csv')}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                exportFormat === 'csv'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <FileSpreadsheet className="w-8 h-8" />
              <span className="font-medium">CSV</span>
              <span className="text-xs opacity-70">Raw data, Excel compatible</span>
            </button>
            <button
              onClick={() => setExportFormat('pdf')}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                exportFormat === 'pdf'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <FileText className="w-8 h-8" />
              <span className="font-medium">PDF</span>
              <span className="text-xs opacity-70">Formatted report</span>
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Date Range</label>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All Time' },
              { value: 'week', label: 'Last 7 Days' },
              { value: 'month', label: 'Last 30 Days' },
              { value: '3months', label: 'Last 3 Months' },
              { value: 'custom', label: 'Custom Range' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  dateRange === option.value
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span>{option.label}</span>
                {dateRange === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Workouts to export:</span>
            <span className="text-lg font-bold text-gray-200">{filteredCount}</span>
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={filteredCount === 0 || exporting}
          loading={exporting}
          className="w-full"
          icon={Download}
        >
          Export {exportFormat.toUpperCase()}
        </Button>
      </div>
    </Modal>
  );
}

export default ExportModal;

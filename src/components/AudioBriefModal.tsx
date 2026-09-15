import React, { useState, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check, Radio } from 'lucide-react';

interface AudioBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachAudio: (fileName: string, duration: string) => void;
}

export const AudioBriefModal: React.FC<AudioBriefModalProps> = ({
  isOpen,
  onClose,
  onAttachAudio
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const toggleRecording = () => {
    if (!isRecording) {
      setSeconds(0);
      setIsRecording(true);
      setHasRecorded(false);
    } else {
      setIsRecording(false);
      setHasRecorded(true);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSave = () => {
    onAttachAudio(`audio_architect_brief_${formatTime(seconds)}.mp3`, formatTime(seconds));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">Record Audio Brief</h3>
              <p className="text-xs text-slate-500">Alex will listen directly to your verbal notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="py-8 flex flex-col items-center justify-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording ? 'bg-red-50 text-red-600 ring-8 ring-red-100 animate-pulse' : 'bg-blue-50 text-blue-600'
          }`}>
            <Radio className={`w-9 h-9 ${isRecording ? 'animate-spin' : ''}`} />
          </div>

          <div className="text-center">
            <div className="font-mono text-2xl font-bold text-slate-900">
              {formatTime(seconds)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isRecording ? 'Listening... speak naturally about your current system' : hasRecorded ? 'Recording ready for Alex' : 'Click start to record'}
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={toggleRecording}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>{hasRecorded ? 'Re-record' : 'Start Audio Brief'}</span>
                </>
              )}
            </button>

            {hasRecorded && !isRecording && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Review'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasRecorded || seconds === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Attach to Discussion</span>
          </button>
        </div>
      </div>
    </div>
  );
};

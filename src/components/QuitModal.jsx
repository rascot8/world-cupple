import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const QuitModal = ({ onConfirm, onCancel, isPractice = false }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="glass-panel w-full max-w-sm p-8 text-center animate-[float-up_0.3s_ease-out]">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">
          Quit Game?
        </h2>
        
        {!isPractice ? (
          <p className="text-gray-300 mb-8 font-medium text-sm">
            Are you sure you want to quit? Quitting will forfeit your daily match and result in a <strong className="text-red-400">0/10 score (-50 FP)</strong>.
          </p>
        ) : (
          <p className="text-gray-300 mb-8 font-medium text-sm">
            Are you sure you want to quit practice mode? Your progress will not be saved.
          </p>
        )}

        <div className="flex flex-col space-y-3">
          <button 
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-lg uppercase tracking-wider transition-colors shadow-[0_0_6px_rgba(239,68,68,0.12)]"
          >
            {isPractice ? 'Quit Practice' : 'Forfeit Match'}
          </button>
          
          <button 
            onClick={onCancel}
            className="w-full py-3 rounded-2xl bg-white/10 text-gray-300 font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuitModal;

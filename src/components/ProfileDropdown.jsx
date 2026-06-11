import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, HelpCircle, LogOut, Trophy } from 'lucide-react';
import { auth } from '../config/firebase';

const ProfileDropdown = ({ onOpenProfile, onOpenRank, onOpenTutorial, onOpenSettings, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userPhoto = auth.currentUser?.photoURL;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden hover:border-fifa-neon transition-colors"
      >
        {userPhoto ? (
          <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className="w-6 h-6 text-gray-300" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-fifa-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-float-up">
          <div className="py-2">
            <button 
              onClick={() => handleMenuClick(onOpenProfile)}
              className="w-full px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/5 transition-colors flex items-center"
            >
              <User className="w-4 h-4 mr-3 text-fifa-neon" />
              Profile
            </button>
            <button 
              onClick={() => handleMenuClick(onOpenSettings)}
              className="w-full px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/5 transition-colors flex items-center"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Settings
            </button>
            <button 
              onClick={() => handleMenuClick(onOpenRank)}
              className="w-full px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/5 transition-colors flex items-center"
            >
              <Trophy className="w-4 h-4 mr-3 text-gold-glow" />
              My Rank
            </button>
            <button 
              onClick={() => handleMenuClick(onOpenTutorial)}
              className="w-full px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/5 transition-colors flex items-center"
            >
              <HelpCircle className="w-4 h-4 mr-3 text-blue-400" />
              How to Play
            </button>
            <div className="border-t border-white/10 my-1"></div>
            <button 
              onClick={() => handleMenuClick(onLogout)}
              className="w-full px-4 py-3 text-left text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors flex items-center"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;

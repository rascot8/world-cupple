import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Moon, Sun, Volume2, VolumeX, User, LogOut } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { validateUsernameFormat, checkProfanity, checkUsernameUniqueness, generateAlternatives } from '../utils/usernameHandler';

const SettingsModal = ({ onClose, userData }) => {
  const { t, i18n } = useTranslation();
  
  // These could come from a global context, but for now we read/write to localStorage
  // and trigger a class change on body for theme.
  const [isDark, setIsDark] = useState(!document.body.classList.contains('light-theme'));
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false');

  const [newUsername, setNewUsername] = useState(userData?.username || '');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [alternatives, setAlternatives] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTheme = () => {
    if (isDark) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('soundEnabled', newState);
  };

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleUsernameChange = async () => {
    setUserError('');
    setUserSuccess('');
    setAlternatives([]);
    
    if (newUsername === userData?.username) return;

    const formatError = validateUsernameFormat(newUsername);
    if (formatError) return setUserError(formatError);

    const profanityError = checkProfanity(newUsername);
    if (profanityError) return setUserError(profanityError);

    setIsSaving(true);
    const isUnique = await checkUsernameUniqueness(newUsername);
    if (!isUnique) {
      setUserError("Username already in use.");
      setAlternatives(generateAlternatives(newUsername));
      setIsSaving(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        username: newUsername
      });
      setUserSuccess("Username updated successfully!");
      // window.location.reload() or let App handle the state update on next snapshot
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      setUserError("Failed to update username.");
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    if (auth) auth.signOut();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-fifa-dark w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-grow">
          
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Preferences</h3>
            
            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="font-bold">Theme</span>
              <button onClick={toggleTheme} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                {isDark ? <Moon className="w-5 h-5 text-fifa-neon" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              </button>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="font-bold">Sound Effects</span>
              <button onClick={toggleSound} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-fifa-neon" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="font-bold">Language</span>
              <select 
                value={i18n.language} 
                onChange={handleLanguageChange}
                className="bg-transparent text-fifa-neon font-bold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer"
              >
                <option value="en" className="text-black">English</option>
                <option value="es" className="text-black">Español</option>
                <option value="fr" className="text-black">Français</option>
                <option value="de" className="text-black">Deutsch</option>
                <option value="pt" className="text-black">Português</option>
                <option value="ar" className="text-black">العربية</option>
                <option value="ja" className="text-black">日本語</option>
                <option value="it" className="text-black">Italiano</option>
                <option value="nl" className="text-black">Nederlands</option>
                <option value="zh" className="text-black">中文</option>
              </select>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Account</h3>
            
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3">
              <label className="font-bold text-sm text-gray-300 flex items-center">
                <User className="w-4 h-4 mr-2"/> Change Username
              </label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="flex-grow p-3 rounded-lg bg-black/30 border border-white/10 text-white focus:outline-none focus:border-fifa-neon"
                  placeholder="New Username"
                />
                <button 
                  onClick={handleUsernameChange}
                  disabled={isSaving || newUsername === userData?.username}
                  className="px-4 py-2 bg-fifa-green text-black font-bold uppercase rounded-lg hover:bg-green-400 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              
              {userError && <p className="text-red-400 text-xs font-bold">{userError}</p>}
              {userSuccess && <p className="text-fifa-neon text-xs font-bold">{userSuccess}</p>}
              
              {alternatives.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Available alternatives:</p>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map(alt => (
                      <button 
                        key={alt}
                        onClick={() => setNewUsername(alt)}
                        className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-bold uppercase tracking-wider"
            >
              <LogOut className="w-5 h-5 mr-2" /> Sign Out
            </button>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

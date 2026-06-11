import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Moon, Sun, Volume2, VolumeX } from 'lucide-react';

const SettingsModal = ({ onClose, userData }) => {
  const { t, i18n } = useTranslation();
  
  // These could come from a global context, but for now we read/write to localStorage
  // and trigger a class change on body for theme.
  const [isDark, setIsDark] = useState(!document.body.classList.contains('light-theme'));
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false');

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



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-fifa-dark w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-black uppercase tracking-wider text-white">{t('Settings') || 'Settings'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-grow">
          
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('Preferences') || 'Preferences'}</h3>
            
            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="font-bold">{t('Theme') || 'Theme'}</span>
              <button onClick={toggleTheme} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                {isDark ? <Moon className="w-5 h-5 text-fifa-neon" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              </button>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="font-bold">{t('Sound Effects') || 'Sound Effects'}</span>
              <button onClick={toggleSound} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-fifa-neon" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="font-bold">{t('Language') || 'Language'}</span>
              <select 
                value={i18n.language?.split('-')[0] || 'en'} 
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



        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

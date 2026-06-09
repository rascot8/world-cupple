import React, { useState } from 'react';
import { Globe, LogIn, Mail, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COUNTRIES } from '../utils/countries';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { validateUsernameFormat, checkProfanity, checkUsernameUniqueness, generateAlternatives } from '../utils/usernameHandler';
import BrandHeader from './BrandHeader';

const AuthScreen = () => {
  const { t, i18n } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [alternatives, setAlternatives] = useState([]);

  const handleGoogleSignIn = async () => {
    try {
      if (auth) {
        await signInWithPopup(auth, googleProvider);
      } else {
        setError("Firebase not configured properly.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (auth) {
        if (isSignUp) {
          setAlternatives([]);
          const formatError = validateUsernameFormat(username);
          if (formatError) return setError(formatError);

          const profanityError = checkProfanity(username);
          if (profanityError) return setError(profanityError);

          const isUnique = await checkUsernameUniqueness(username);
          if (!isUnique) {
            setError("Username already in use.");
            setAlternatives(generateAlternatives(username));
            return;
          }

          if (country) {
            localStorage.setItem('pendingCountry', country);
          } else {
            localStorage.setItem('pendingCountry', 'NONE');
          }
          localStorage.setItem('pendingUsername', username);
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } else {
        setError("Firebase not configured properly.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">

      
      <div className="absolute top-6 right-6 z-10 flex items-center space-x-2 bg-white/10 rounded-full p-1 backdrop-blur-md">
        <Globe className="w-5 h-5 text-white ml-2" />
        {['en', 'es', 'fr', 'pt', 'ar'].map((lang) => (
          <button 
            key={lang}
            onClick={() => changeLanguage(lang)}
            className={`px-3 py-1 rounded-full text-sm font-bold transition-colors uppercase ${i18n.language.startsWith(lang) ? 'bg-fifa-green text-fifa-black' : 'text-white hover:text-fifa-neon'}`}
          >
            {lang}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <BrandHeader isHero={true} />

        <div className="w-full glass-panel p-8">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wider text-center">
            {isSignUp ? t('Sign Up') : t('Sign In')}
          </h2>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold text-center">{error}</div>}
          
          {alternatives.length > 0 && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-400 mb-1">Available alternatives:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {alternatives.map(alt => (
                  <button 
                    key={alt}
                    type="button"
                    onClick={() => { setUsername(alt); setAlternatives([]); setError(''); }}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 mb-6 rounded-xl bg-white text-gray-900 font-bold flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {t('Sign in with Google')}
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-grow h-px bg-white/20"></div>
            <span className="px-4 text-xs font-bold text-gray-400 uppercase">OR</span>
            <div className="flex-grow h-px bg-white/20"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-4 pl-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-fifa-green transition-colors"
                  required={isSignUp}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder={t('Email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 pl-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-fifa-green transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder={t('Password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-fifa-green transition-colors"
                required
              />
            </div>
            
            {isSignUp && (
              <div>
                <select 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-fifa-green transition-colors appearance-none"
                >
                  <option value="" disabled className="text-gray-500">Choose Your Nation (Optional)</option>
                  <option value="NONE" className="text-black text-gray-500">No thanks / Skip</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="text-black">
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-fifa-green to-fifa-neon text-fifa-black font-black text-lg uppercase tracking-wider hover:scale-[1.02] transition-transform"
            >
              {isSignUp ? t('Sign Up') : t('Sign In')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-fifa-neon hover:underline font-bold"
            >
              {isSignUp ? t('Sign In') : t('Sign Up')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;

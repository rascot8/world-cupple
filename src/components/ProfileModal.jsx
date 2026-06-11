import React, { useState } from 'react';
import { X, User, Globe2 } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { validateUsernameFormat, checkProfanity, checkUsernameUniqueness, generateAlternatives } from '../utils/usernameHandler';
import { COUNTRIES } from '../utils/countries';

const ProfileModal = ({ onClose, userData }) => {
  const [newUsername, setNewUsername] = useState(userData?.username || '');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [alternatives, setAlternatives] = useState([]);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(userData?.country || '');
  const [countrySuccess, setCountrySuccess] = useState('');
  const [isSavingCountry, setIsSavingCountry] = useState(false);

  const handleUsernameChange = async () => {
    setUserError('');
    setUserSuccess('');
    setAlternatives([]);
    
    if (newUsername === userData?.username) return;

    const formatError = validateUsernameFormat(newUsername);
    if (formatError) return setUserError(formatError);

    const profanityError = checkProfanity(newUsername);
    if (profanityError) return setUserError(profanityError);

    setIsSavingUser(true);
    const isUnique = await checkUsernameUniqueness(newUsername);
    if (!isUnique) {
      setUserError("Username already in use.");
      setAlternatives(generateAlternatives(newUsername));
      setIsSavingUser(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        username: newUsername
      });
      setUserSuccess("Username updated successfully!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      setUserError("Failed to update username.");
    }
    setIsSavingUser(false);
  };

  const handleCountryChange = async () => {
    if (selectedCountry === userData?.country) return;
    setCountrySuccess('');
    setIsSavingCountry(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        country: selectedCountry
      });
      setCountrySuccess("Country updated successfully!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      // ignore
    }
    setIsSavingCountry(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-fifa-dark w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-float-up">
        
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-black uppercase tracking-wider text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-fifa-neon" /> Profile
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          
          <div className="flex flex-col items-center mb-4">
            <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden mb-3">
              {auth.currentUser?.photoURL ? (
                <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <p className="text-gray-400 text-sm font-bold">{auth.currentUser?.email}</p>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Username</h3>
            <div className="flex flex-col gap-3">
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
                  disabled={isSavingUser || newUsername === userData?.username || !newUsername}
                  className="px-4 py-2 bg-fifa-green text-black font-bold uppercase rounded-lg hover:bg-green-400 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              
              {userError && <p className="text-red-400 text-xs font-bold">{userError}</p>}
              {userSuccess && <p className="text-fifa-neon text-xs font-bold">{userSuccess}</p>}
              
              {alternatives.length > 0 && (
                <div className="mt-1">
                  <p className="text-xs text-gray-400 mb-1">Available alternatives:</p>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map(alt => (
                      <button 
                        key={alt}
                        onClick={() => setNewUsername(alt)}
                        className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-gray-300"
                      >
                        {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <Globe2 className="w-4 h-4 mr-2" /> Nationality
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex space-x-2">
                <select 
                  value={selectedCountry} 
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="flex-grow p-3 rounded-lg bg-black/30 border border-white/10 text-white focus:outline-none focus:border-fifa-green appearance-none"
                >
                  <option value="NONE" className="text-gray-500">None</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="text-black">
                      {c.emoji} {c.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleCountryChange}
                  disabled={isSavingCountry || selectedCountry === userData?.country}
                  className="px-4 py-2 bg-fifa-green text-black font-bold uppercase rounded-lg hover:bg-green-400 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              {countrySuccess && <p className="text-fifa-neon text-xs font-bold">{countrySuccess}</p>}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

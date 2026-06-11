import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, limit, getDocs, getCountFromServer, where, documentId, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getRankForFP } from '../utils/ranking';
import { getFlagForCountry } from '../utils/countries';
import { ArrowLeft, Users, ChevronUp, ChevronDown, Minus, Star } from 'lucide-react';
import { getTodayUTCString } from '../utils/dailySeed';
import { getGhostPlayers, GHOST_COUNT } from '../utils/ghostPlayers';
import BrandHeader from './BrandHeader';

const LeaderboardScreen = ({ onBack, userData }) => {
  const { t } = useTranslation();
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [tab, setTab] = useState('global'); // 'global' or 'friends'

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!db) return;
        const coll = collection(db, 'users');
        const snapshot = await getCountFromServer(coll);
        // The ghost field plays too — the stadium is never empty.
        setTotalPlayers(snapshot.data().count + GHOST_COUNT);
      } catch (e) {
        console.error("Count fetch error", e);
        setTotalPlayers(GHOST_COUNT);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        if (!db) return;

        const today = getTodayUTCString();

        if (tab === 'friends') {
          const friendsList = userData?.friends || [];
          const uids = [auth?.currentUser?.uid, ...friendsList].slice(0, 30); // Firestore 'in' limit is 30
          if (uids.length === 0) { setTopUsers([]); return; }
          const snapshot = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', uids)));
          const users = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          users.sort((a, b) => (b.fp || 0) - (a.fp || 0));
          setTopUsers(users);
          return;
        }

        // ——— Global: real players blended with the deterministic ghost field ———
        const snapshot = await getDocs(query(collection(db, 'users'), orderBy('fp', 'desc'), limit(50)));
        const realUsers = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

        // Daily snapshot of real users' ranks for the movement arrows.
        // Best-effort: locked-down rules may reject cross-user writes — the
        // board must render regardless.
        try {
          const metaRef = doc(db, 'meta', 'leaderboard');
          const metaSnap = await getDoc(metaRef);
          if (!metaSnap.exists() || metaSnap.data().lastResetDate !== today) {
            const batch = writeBatch(db);
            realUsers.forEach((u, index) => {
              batch.update(doc(db, 'users', u.id), { startOfDayRank: index + 1 });
              u.startOfDayRank = index + 1;
            });
            batch.set(metaRef, { lastResetDate: today }, { merge: true });
            await batch.commit();
          }
        } catch (e) {
          console.warn('Rank snapshot skipped:', e?.code || e);
        }

        const merged = [...realUsers, ...getGhostPlayers(today)]
          .sort((a, b) => (b.fp || 0) - (a.fp || 0))
          .slice(0, 50);

        // Ghosts carry a relative day-on-day delta; anchor it to their merged
        // position so the existing arrow renderer just works.
        merged.forEach((u, index) => {
          if (u.isGhost) u.startOfDayRank = index + 1 + (u.ghostRankDelta || 0);
        });

        setTopUsers(merged);
      } catch (err) {
        console.error("Leaderboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [tab, userData]);

  return (
    <div className="min-h-screen flex flex-col p-6 relative">

      <BrandHeader isHero={false} />

      <button onClick={onBack} className="absolute top-6 right-6 z-50 text-white hover:text-fifa-neon flex items-center font-bold uppercase tracking-wider text-sm">
        {t('Back')} <ArrowLeft className="w-5 h-5 ml-2 transform rotate-180" />
      </button>

      <div className="w-full max-w-md mx-auto z-10 pt-16 flex-grow flex flex-col">

        {/* Strict Tabs */}
        <div className="flex justify-center items-center mb-6 space-x-8 border-b border-white/10 pb-2">
          <button
            onClick={() => setTab('global')}
            className={`text-xl font-black uppercase tracking-wider transition-all duration-300 relative ${tab === 'global' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Global
            {tab === 'global' && <div className="absolute -bottom-2 left-0 w-full h-1 bg-fifa-neon rounded-t-lg shadow-[0_0_4px_rgba(57,255,20,0.2)]"></div>}
          </button>

          <button
            onClick={() => setTab('friends')}
            className={`text-xl font-black uppercase tracking-wider transition-all duration-300 relative ${tab === 'friends' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Friends
            {tab === 'friends' && <div className="absolute -bottom-2 left-0 w-full h-1 bg-fifa-neon rounded-t-lg shadow-[0_0_4px_rgba(57,255,20,0.2)]"></div>}
          </button>
        </div>

        {tab === 'global' && (
          <div className="flex items-center justify-center text-gray-400 mb-6 space-x-2 text-sm font-bold bg-white/5 py-2 px-4 rounded-full mx-auto w-fit">
            <Users className="w-4 h-4" />
            <span>{totalPlayers.toLocaleString()} Active Players</span>
          </div>
        )}

        <div className="flex-grow overflow-y-auto space-y-3 pb-24">
          {loading ? (
            <div className="text-center text-gray-400 font-bold uppercase tracking-widest mt-10">Loading...</div>
          ) : topUsers.length === 0 ? (
             <div className="text-center text-gray-400 font-bold uppercase mt-10">No users found.</div>
          ) : (
            topUsers.map((u, index) => {
              const rank = getRankForFP(u.fp);
              const isMe = u.id === auth?.currentUser?.uid;
              const currentRank = index + 1;
              const startRank = u.startOfDayRank || currentRank;
              const spotsMoved = startRank - currentRank;

              return (
                <div key={u.id} className={`flex items-center p-4 rounded-xl border ${isMe ? 'bg-fifa-green/10 border-fifa-green' : 'bg-white/5 border-white/10'}`}>
                  <div className="w-8 font-bold text-lg text-gray-500 mr-2 text-center">#{currentRank}</div>

                  <div className="w-10 flex flex-col items-center justify-center mr-2">
                    {spotsMoved > 0 ? (
                      <div className="flex flex-col items-center text-fifa-neon">
                        <ChevronUp className="w-4 h-4" />
                        <span className="text-[10px] font-bold">+{spotsMoved}</span>
                      </div>
                    ) : spotsMoved < 0 ? (
                      <div className="flex flex-col items-center text-red-500">
                        <ChevronDown className="w-4 h-4" />
                        <span className="text-[10px] font-bold">{spotsMoved}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <Minus className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="text-2xl mr-3">{getFlagForCountry(u.country)}</div>
                  <div className="flex-grow min-w-0">
                    <p className={`font-semibold truncate tracking-wide flex items-center gap-1.5 ${u.vip ? 'text-yellow-300' : 'text-white'}`}>
                      {u.username || u.email?.split('@')[0] || 'Player'}
                      {u.vip && <Star className="w-3.5 h-3.5 shrink-0 text-yellow-300" fill="currentColor" />}
                    </p>
                    <p className={`text-[10px] uppercase font-bold tracking-widest ${rank.color}`}>{rank.name}</p>
                  </div>
                  <div className="text-right pl-2 whitespace-nowrap">
                    <span className="font-black text-lg text-gold-glow tabular-nums">{u.fp}</span>
                    <span className="font-bold text-xs text-gray-400 ml-1">FP</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardScreen;

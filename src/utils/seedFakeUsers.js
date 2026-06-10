import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const seedFakeUsers = async () => {
  if (!db) return;

  const fakeUsers = [
    {
      id: 'fake_user_1',
      username: 'MessiGOAT',
      country: 'AR',
      fp: 5200,
      startOfDayRank: 1, // Will be updated by the reset script if needed, but starting at 1
      lastPlayedDate: '2026-06-08',
      badges: ['world_champion', 'legendary_status']
    },
    {
      id: 'fake_user_2',
      username: 'CR7_Siuuu',
      country: 'PT',
      fp: 4850,
      startOfDayRank: 2,
      lastPlayedDate: '2026-06-08',
      badges: ['captains_armband']
    },
    {
      id: 'fake_user_3',
      username: 'Mbappe_Speed',
      country: 'FR',
      fp: 3100,
      startOfDayRank: 4, // Intentionally out of order to simulate movement
      lastPlayedDate: '2026-06-08',
      badges: ['midfield_maestro']
    },
    {
      id: 'fake_user_4',
      username: 'NeymarSkillz',
      country: 'BR',
      fp: 2950,
      startOfDayRank: 3, // Moved down!
      lastPlayedDate: '2026-06-08',
      badges: []
    },
    {
      id: 'fake_user_5',
      username: 'Bellingham99',
      country: 'GB', // England
      fp: 1500,
      startOfDayRank: 5,
      lastPlayedDate: '2026-06-08',
      badges: ['off_the_mark']
    }
  ];

  try {
    for (const user of fakeUsers) {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        username: user.username,
        country: user.country,
        fp: user.fp,
        startOfDayRank: user.startOfDayRank,
        lastPlayedDate: user.lastPlayedDate,
        badges: user.badges
      }, { merge: true });
    }
    console.log("Fake users seeded successfully!");
    localStorage.setItem('hasSeededFakeUsers', 'true');
  } catch (error) {
    console.error("Error seeding fake users:", error);
  }
};

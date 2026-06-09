import { Filter } from 'bad-words';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const filter = new Filter();

export const validateUsernameFormat = (username) => {
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(username)) {
    return "Username can only contain letters, numbers, and underscores (no spaces).";
  }
  if (username.length < 3 || username.length > 15) {
    return "Username must be between 3 and 15 characters.";
  }
  return null;
};

export const checkProfanity = (username) => {
  const lowerName = username.toLowerCase();
  const containsBadWord = filter.list.some(word => lowerName.includes(word.toLowerCase()));
  
  if (containsBadWord || filter.isProfane(username)) {
    return "Username contains restricted words. Please choose another.";
  }
  return null;
};

export const checkUsernameUniqueness = async (username) => {
  if (!db) return true;
  const q = query(collection(db, 'users'), where('username', '==', username));
  const snapshot = await getDocs(q);
  return snapshot.empty;
};

export const generateAlternatives = (username) => {
  return [
    `${username}99`,
    `${username}_FC`,
    `${username}2026`
  ];
};

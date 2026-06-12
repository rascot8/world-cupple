import React, { useState, useEffect } from 'react';
import { normalizeText } from '../../utils/grading';
import { Send } from 'lucide-react';

// Shared free-text round (anagram, missing vowels): a big puzzle display, a
// text input and a lock-it-in button. The reveal compares normalized text.
const TextAnswerRound = ({ puzzle, hintLine, placeholder, question, locked, answer, choice, overturned, submit }) => {
  const [value, setValue] = useState('');
  useEffect(() => { setValue(''); }, [question]);

  const revealed = locked && answer;
  const wasRight = revealed && (overturned ||
    normalizeText(choice) === normalizeText(answer.correctAnswer) ||
    (answer.accepted || []).some((a) => normalizeText(a) === normalizeText(choice)));

  return (
    <div>
      {question.text && (
        <p className="text-center text-gray-300 font-bold mb-3">{question.text}</p>
      )}
      <div className="text-center mb-2">
        <span className="inline-block px-5 py-4 rounded-2xl bg-black/30 border border-fifa-neon/40 text-3xl font-black tracking-[0.25em] text-fifa-neon break-words">
          {puzzle}
        </span>
      </div>
      {hintLine && <p className="text-center text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">{hintLine}</p>}

      {!revealed ? (
        <form
          className="flex gap-2 mt-4"
          onSubmit={(e) => { e.preventDefault(); if (value.trim()) submit(value.trim()); }}
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={locked}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-grow p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white font-bold text-lg focus:outline-none focus:border-fifa-neon"
          />
          <button
            type="submit"
            disabled={locked || !value.trim()}
            className="px-5 rounded-2xl bg-fifa-neon text-black font-black uppercase tracking-wider disabled:opacity-40 hover:scale-105 transition-transform flex items-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      ) : (
        <div className={`mt-4 p-4 rounded-2xl border-2 text-center ${wasRight ? 'bg-green-500/15 border-green-500' : 'bg-red-500/15 border-red-500'}`}>
          {choice && (
            <p className={`font-bold ${wasRight ? 'text-green-400' : 'text-red-400 line-through'}`}>{choice}</p>
          )}
          <p className="text-white font-black text-xl mt-1">
            {wasRight ? '✅' : '❌'} {answer.correctAnswer}
          </p>
        </div>
      )}
    </div>
  );
};

export default TextAnswerRound;

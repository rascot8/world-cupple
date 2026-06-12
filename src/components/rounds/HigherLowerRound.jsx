import React from 'react';
import OptionGrid from './OptionGrid';

// "Which is higher?" — two big buttons, one metric.
const HigherLowerRound = ({ question, locked, answer, choice, overturned, submit, eliminated }) => {
  const { payload = {} } = question;
  return (
    <div>
      <h2 className="text-2xl font-black text-white leading-tight text-center mb-1">
        {question.text || 'Which is higher?'}
      </h2>
      {payload.metric && (
        <p className="text-center text-fifa-neon text-sm font-black uppercase tracking-wider mb-2">
          {payload.metric}
        </p>
      )}
      <OptionGrid
        options={[payload.itemA, payload.itemB].filter(Boolean)}
        choice={choice}
        correct={answer?.correctAnswer || null}
        locked={locked}
        overturned={overturned}
        eliminated={eliminated}
        onChoose={submit}
      />
    </div>
  );
};

export default HigherLowerRound;

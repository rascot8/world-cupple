import React from 'react';
import OptionGrid from './OptionGrid';

// Four options, one impostor — tap the odd one out.
const OddOneOutRound = ({ question, locked, answer, choice, overturned, submit, eliminated }) => (
  <div>
    <h2 className="text-2xl font-black text-white leading-tight text-center mb-2">
      {question.text}
    </h2>
    <OptionGrid
      options={question.payload?.options || []}
      choice={choice}
      correct={answer?.correctAnswer || null}
      locked={locked}
      overturned={overturned}
      eliminated={eliminated}
      onChoose={submit}
      compact
    />
  </div>
);

export default OddOneOutRound;

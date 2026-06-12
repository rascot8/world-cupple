import React from 'react';
import OptionGrid from './OptionGrid';

// Classic multiple-choice trivia (the original daily format).
const TriviaRound = ({ question, locked, answer, choice, overturned, submit, eliminated }) => (
  <div>
    <h2 className="text-3xl font-black text-white leading-tight text-center mb-2">
      {question.text}
    </h2>
    <OptionGrid
      options={question.options || []}
      choice={choice}
      correct={answer?.correctAnswer || null}
      locked={locked}
      overturned={overturned}
      eliminated={eliminated}
      onChoose={submit}
    />
  </div>
);

export default TriviaRound;

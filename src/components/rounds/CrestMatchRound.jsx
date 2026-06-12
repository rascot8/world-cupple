import React from 'react';
import OptionGrid from './OptionGrid';

// Identify the crest / flag / colors in the image.
const CrestMatchRound = ({ question, locked, answer, choice, overturned, submit, eliminated }) => {
  const { payload = {} } = question;
  return (
    <div>
      <h2 className="text-2xl font-black text-white leading-tight text-center mb-4">
        {question.text || 'Whose colors are these?'}
      </h2>
      <div className="flex justify-center mb-2">
        <div className="p-3 rounded-2xl bg-white/10 border-2 border-white/20">
          <img
            src={payload.imageUrl}
            alt="Mystery crest"
            className="h-28 w-auto max-w-[220px] object-contain rounded-lg"
            draggable={false}
          />
        </div>
      </div>
      <OptionGrid
        options={payload.options || []}
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
};

export default CrestMatchRound;

import React from 'react';
import TextAnswerRound from './TextAnswerRound';

const MissingVowelsRound = (props) => {
  const { payload = {} } = props.question;
  return (
    <TextAnswerRound
      {...props}
      puzzle={payload.puzzle}
      hintLine={`Add the vowels back${payload.category ? ` · ${payload.category}` : ''}`}
      placeholder="Full answer…"
    />
  );
};

export default MissingVowelsRound;

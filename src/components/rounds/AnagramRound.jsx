import React from 'react';
import TextAnswerRound from './TextAnswerRound';

const AnagramRound = (props) => {
  const { payload = {} } = props.question;
  return (
    <TextAnswerRound
      {...props}
      puzzle={payload.scrambled}
      hintLine={`Unscramble it${payload.category ? ` · ${payload.category}` : ''}`}
      placeholder="Your answer…"
    />
  );
};

export default AnagramRound;

import React from 'react';
import RoundShell from './RoundShell';
import TriviaRound from './TriviaRound';
import AnagramRound from './AnagramRound';
import MissingVowelsRound from './MissingVowelsRound';
import HigherLowerRound from './HigherLowerRound';
import ClosestGuessRound from './ClosestGuessRound';
import YearGuesserRound from './YearGuesserRound';
import CareerPathRound from './CareerPathRound';
import CrestMatchRound from './CrestMatchRound';
import TimelineRound from './TimelineRound';
import OddOneOutRound from './OddOneOutRound';

const COMPONENTS = {
  standard: TriviaRound,
  anagram: AnagramRound,
  missingVowels: MissingVowelsRound,
  higherLower: HigherLowerRound,
  closestGuess: ClosestGuessRound,
  yearGuesser: YearGuesserRound,
  careerPath: CareerPathRound,
  crestMatch: CrestMatchRound,
  timelineOrder: TimelineRound,
  oddOneOut: OddOneOutRound
};

// Dispatch a daily round to its type-specific component inside the shared
// shell. Unknown/legacy types render as classic trivia.
const RoundRouter = (props) => {
  const Component = COMPONENTS[props.question?.type] || TriviaRound;
  return (
    <RoundShell {...props}>
      {(roundProps) => <Component {...roundProps} />}
    </RoundShell>
  );
};

export default RoundRouter;

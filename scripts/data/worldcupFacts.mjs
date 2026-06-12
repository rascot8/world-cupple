/**
 * Curated World Cup facts used by seedWorldCupDailies.mjs to generate each
 * day's 10 themed rounds. Numbers here become correct answers, so only edit
 * with sources in hand.
 */

// team -> { code: flagcdn ISO code, titles: WC wins, firstYear: first WC
// appearance (null if debuting in 2026), star: current headline player (null
// if no obvious pick) }
export const TEAMS = {
  'Mexico':                 { code: 'mx',     titles: 0, firstYear: 1930, star: 'Santiago Giménez' },
  'South Africa':           { code: 'za',     titles: 0, firstYear: 1998, star: null },
  'South Korea':            { code: 'kr',     titles: 0, firstYear: 1954, star: 'Son Heung-min' },
  'Czechia':                { code: 'cz',     titles: 0, firstYear: 1934, star: null },
  'Canada':                 { code: 'ca',     titles: 0, firstYear: 1986, star: 'Alphonso Davies' },
  'Bosnia and Herzegovina': { code: 'ba',     titles: 0, firstYear: 2014, star: 'Edin Džeko' },
  'Qatar':                  { code: 'qa',     titles: 0, firstYear: 2022, star: 'Akram Afif' },
  'Switzerland':            { code: 'ch',     titles: 0, firstYear: 1934, star: 'Granit Xhaka' },
  'Brazil':                 { code: 'br',     titles: 5, firstYear: 1930, star: 'Vinícius Júnior' },
  'Morocco':                { code: 'ma',     titles: 0, firstYear: 1970, star: 'Achraf Hakimi' },
  'Haiti':                  { code: 'ht',     titles: 0, firstYear: 1974, star: null },
  'Scotland':               { code: 'gb-sct', titles: 0, firstYear: 1954, star: 'Scott McTominay' },
  'United States':          { code: 'us',     titles: 0, firstYear: 1930, star: 'Christian Pulisic' },
  'Paraguay':               { code: 'py',     titles: 0, firstYear: 1930, star: 'Miguel Almirón' },
  'Australia':              { code: 'au',     titles: 0, firstYear: 1974, star: null },
  'Türkiye':                { code: 'tr',     titles: 0, firstYear: 1954, star: 'Arda Güler' },
  'Germany':                { code: 'de',     titles: 4, firstYear: 1934, star: 'Jamal Musiala' },
  'Curaçao':                { code: 'cw',     titles: 0, firstYear: null, star: null },
  'Ivory Coast':            { code: 'ci',     titles: 0, firstYear: 2006, star: 'Franck Kessié' },
  'Ecuador':                { code: 'ec',     titles: 0, firstYear: 2002, star: 'Moisés Caicedo' },
  'Netherlands':            { code: 'nl',     titles: 0, firstYear: 1934, star: 'Cody Gakpo' },
  'Japan':                  { code: 'jp',     titles: 0, firstYear: 1998, star: 'Takefusa Kubo' },
  'Sweden':                 { code: 'se',     titles: 0, firstYear: 1934, star: 'Alexander Isak' },
  'Tunisia':                { code: 'tn',     titles: 0, firstYear: 1978, star: null },
  'Belgium':                { code: 'be',     titles: 0, firstYear: 1930, star: 'Kevin De Bruyne' },
  'Egypt':                  { code: 'eg',     titles: 0, firstYear: 1934, star: 'Mohamed Salah' },
  'Iran':                   { code: 'ir',     titles: 0, firstYear: 1978, star: 'Mehdi Taremi' },
  'New Zealand':            { code: 'nz',     titles: 0, firstYear: 1982, star: 'Chris Wood' },
  'Spain':                  { code: 'es',     titles: 1, firstYear: 1934, star: 'Lamine Yamal' },
  'Cape Verde':             { code: 'cv',     titles: 0, firstYear: null, star: null },
  'Saudi Arabia':           { code: 'sa',     titles: 0, firstYear: 1994, star: 'Salem Al-Dawsari' },
  'Uruguay':                { code: 'uy',     titles: 2, firstYear: 1930, star: 'Federico Valverde' },
  'France':                 { code: 'fr',     titles: 2, firstYear: 1930, star: 'Kylian Mbappé' },
  'Senegal':                { code: 'sn',     titles: 0, firstYear: 2002, star: 'Sadio Mané' },
  'Iraq':                   { code: 'iq',     titles: 0, firstYear: 1986, star: null },
  'Norway':                 { code: 'no',     titles: 0, firstYear: 1938, star: 'Erling Haaland' },
  'Argentina':              { code: 'ar',     titles: 3, firstYear: 1930, star: 'Lionel Messi' },
  'Algeria':                { code: 'dz',     titles: 0, firstYear: 1982, star: 'Riyad Mahrez' },
  'Austria':                { code: 'at',     titles: 0, firstYear: 1934, star: 'Marko Arnautović' },
  'Jordan':                 { code: 'jo',     titles: 0, firstYear: null, star: 'Musa Al-Taamari' },
  'Portugal':               { code: 'pt',     titles: 0, firstYear: 1966, star: 'Cristiano Ronaldo' },
  'DR Congo':               { code: 'cd',     titles: 0, firstYear: 1974, star: null },
  'Uzbekistan':             { code: 'uz',     titles: 0, firstYear: null, star: 'Abdukodir Khusanov' },
  'Colombia':               { code: 'co',     titles: 0, firstYear: 1962, star: 'Luis Díaz' },
  'England':                { code: 'gb-eng', titles: 1, firstYear: 1950, star: 'Jude Bellingham' },
  'Croatia':                { code: 'hr',     titles: 0, firstYear: 1998, star: 'Luka Modrić' },
  'Ghana':                  { code: 'gh',     titles: 0, firstYear: 2006, star: 'Mohammed Kudus' },
  'Panama':                 { code: 'pa',     titles: 0, firstYear: 2018, star: null }
};

export const flagUrl = (team) => `https://flagcdn.com/w320/${TEAMS[team].code}.png`;

// World Cup 2026 venues by host city (closest-guess capacity rounds).
export const VENUES = {
  'Mexico City':    { stadium: 'Estadio Azteca', capacity: 87523 },
  'East Rutherford':{ stadium: 'MetLife Stadium', capacity: 82500 },
  'Arlington':      { stadium: 'AT&T Stadium', capacity: 80000 },
  'Kansas City':    { stadium: 'Arrowhead Stadium', capacity: 76416 },
  'Houston':        { stadium: 'NRG Stadium', capacity: 72220 },
  'Atlanta':        { stadium: 'Mercedes-Benz Stadium', capacity: 71000 },
  'Inglewood':      { stadium: 'SoFi Stadium', capacity: 70240 },
  'Philadelphia':   { stadium: 'Lincoln Financial Field', capacity: 69796 },
  'Seattle':        { stadium: 'Lumen Field', capacity: 69000 },
  'Santa Clara':    { stadium: "Levi's Stadium", capacity: 68500 },
  'Foxborough':     { stadium: 'Gillette Stadium', capacity: 65878 },
  'Miami Gardens':  { stadium: 'Hard Rock Stadium', capacity: 64767 },
  'Vancouver':      { stadium: 'BC Place', capacity: 54500 },
  'Guadalupe':      { stadium: 'Estadio BBVA', capacity: 53500 },
  'Monterrey':      { stadium: 'Estadio BBVA', capacity: 53500 },
  'Zapopan':        { stadium: 'Estadio Akron', capacity: 49813 },
  'Guadalajara':    { stadium: 'Estadio Akron', capacity: 49813 },
  'Toronto':        { stadium: 'BMO Field', capacity: 45736 }
};

// Extra closest-guess facts for days where the venue is unknown/repeated.
export const NUMBER_FACTS = [
  { prompt: 'How many goals were scored at the 2022 World Cup in Qatar?', value: 172, min: 100, max: 250, step: 1, unit: 'goals' },
  { prompt: 'How many matches will be played at the 2026 World Cup?', value: 104, min: 60, max: 160, step: 1, unit: 'matches' },
  { prompt: 'How many teams qualified for the 2026 World Cup?', value: 48, min: 24, max: 80, step: 1, unit: 'teams' },
  { prompt: "How many World Cup goals did Miroslav Klose finish with — the all-time record?", value: 16, min: 5, max: 30, step: 1, unit: 'goals' },
  { prompt: 'How many goals did Just Fontaine score at the 1958 World Cup — still a single-tournament record?', value: 13, min: 5, max: 25, step: 1, unit: 'goals' },
  { prompt: 'How many host cities are staging the 2026 World Cup?', value: 16, min: 5, max: 30, step: 1, unit: 'cities' },
  { prompt: 'How many penalties (excluding shootouts) were awarded at the 2018 World Cup — a record?', value: 29, min: 5, max: 60, step: 1, unit: 'penalties' },
  { prompt: 'How many nations have won the World Cup (before 2026)?', value: 8, min: 3, max: 20, step: 1, unit: 'nations' }
];

// Year-guesser facts (event + exact year).
export const YEAR_FACTS = [
  { prompt: 'The very first World Cup was held in Uruguay. What year?', year: 1930 },
  { prompt: 'The Maracanazo: Uruguay silenced 200,000 fans in Rio. What year?', year: 1950 },
  { prompt: 'A 17-year-old Pelé won his first World Cup. What year?', year: 1958 },
  { prompt: 'England lifted the trophy at Wembley. What year?', year: 1966 },
  { prompt: "Maradona's 'Hand of God' (and the Goal of the Century). What year?", year: 1986 },
  { prompt: 'The World Cup was first hosted in the USA. What year?', year: 1994 },
  { prompt: 'France won their first World Cup, on home soil. What year?', year: 1998 },
  { prompt: "Zidane's headbutt ended his career in a World Cup final. What year?", year: 2006 },
  { prompt: 'Spain won their first World Cup, in South Africa. What year?', year: 2010 },
  { prompt: 'Germany beat hosts Brazil 7–1 in the semi-final. What year?', year: 2014 },
  { prompt: 'Messi finally lifted the World Cup, in Qatar. What year?', year: 2022 },
  { prompt: 'The World Cup expanded from 24 to 32 teams. What year?', year: 1998 },
  { prompt: 'The first World Cup held in Asia (Korea/Japan). What year?', year: 2002 },
  { prompt: 'The first African World Cup kicked off in Johannesburg. What year?', year: 2010 }
];

// Timeline events (label + year). The generator picks 4 with distinct years.
export const TIMELINE_EVENTS = [
  { label: 'Uruguay host and win the first World Cup', year: 1930 },
  { label: 'The Maracanazo stuns Brazil', year: 1950 },
  { label: 'Teenage Pelé announces himself in Sweden', year: 1958 },
  { label: 'England win it at Wembley', year: 1966 },
  { label: "Cruyff's Total Football lights up the final", year: 1974 },
  { label: "Maradona's Hand of God", year: 1986 },
  { label: 'Roger Milla dances at Italia 90', year: 1990 },
  { label: 'The World Cup lands in the USA', year: 1994 },
  { label: 'France win on home soil', year: 1998 },
  { label: "Ronaldo's redemption in Yokohama", year: 2002 },
  { label: "Zidane's headbutt in Berlin", year: 2006 },
  { label: "Spain's tiki-taka conquers the world", year: 2010 },
  { label: 'Germany 7–1 Brazil', year: 2014 },
  { label: 'France lift it in Moscow', year: 2018 },
  { label: 'Messi completes football in Qatar', year: 2022 },
  { label: 'The 48-team era kicks off in North America', year: 2026 }
];

// Career Path legends: 4 clues (obscure → giveaway), the answer and 3
// distractors. `country` lets the generator theme to that day's fixtures.
export const LEGENDS = [
  { country: 'Brazil', answer: 'Pelé', distractors: ['Garrincha', 'Romário', 'Zico'], clues: [
    'Signed for Santos at 15 and stayed for nearly two decades.',
    'Finished his career with the New York Cosmos.',
    'The only player to win three World Cups.',
    'Brazil\'s "O Rei" — wore the 10 in 1958, 1962 and 1970.' ] },
  { country: 'Argentina', answer: 'Diego Maradona', distractors: ['Mario Kempes', 'Gabriel Batistuta', 'Juan Román Riquelme'], clues: [
    'Started at Argentinos Juniors before a record move to Barcelona.',
    'Became a deity in Naples, winning two Serie A titles.',
    'Scored twice against England in one 1986 quarter-final — one with his hand.',
    'Captained Argentina to the 1986 World Cup.' ] },
  { country: 'France', answer: 'Zinedine Zidane', distractors: ['Michel Platini', 'Thierry Henry', 'Patrick Vieira'], clues: [
    'Began at Cannes, broke through at Bordeaux.',
    'Won the Champions League with a legendary volley for Real Madrid.',
    'Scored two headers in the 1998 final.',
    'Sent off for a headbutt in his last ever match, the 2006 final.' ] },
  { country: 'Germany', answer: 'Franz Beckenbauer', distractors: ['Gerd Müller', 'Lothar Matthäus', 'Karl-Heinz Rummenigge'], clues: [
    'Spent his peak years at Bayern Munich as a sweeper.',
    'Nicknamed "Der Kaiser".',
    'Won the World Cup as a player in 1974 and as a manager in 1990.',
    'Lifted the 1974 trophy as West Germany\'s captain.' ] },
  { country: 'Netherlands', answer: 'Johan Cruyff', distractors: ['Marco van Basten', 'Ruud Gullit', 'Dennis Bergkamp'], clues: [
    'Came through the Ajax academy and won three straight European Cups.',
    'A famous turn at the 1974 World Cup is named after him.',
    'Won the Ballon d\'Or three times in the 1970s.',
    'The face of Total Football and the number 14.' ] },
  { country: 'Brazil', answer: 'Ronaldo Nazário', distractors: ['Ronaldinho', 'Rivaldo', 'Kaká'], clues: [
    'Left Cruzeiro as a teenager for PSV Eindhoven.',
    'Suffered a mysterious fit on the day of the 1998 final.',
    'Scored both goals in the 2002 final against Germany.',
    'Brazil\'s "O Fenômeno" — the original Ronaldo.' ] },
  { country: 'Portugal', answer: 'Eusébio', distractors: ['Luís Figo', 'Rui Costa', 'Paulo Futre'], clues: [
    'Born in Mozambique, became a one-club Benfica legend.',
    'Nicknamed the "Black Panther".',
    'Top scorer of the 1966 World Cup with nine goals.',
    'Portugal\'s first global superstar, decades before Ronaldo.' ] },
  { country: 'England', answer: 'Bobby Charlton', distractors: ['Geoff Hurst', 'Bobby Moore', 'Gary Lineker'], clues: [
    'Survived the Munich air disaster in 1958.',
    'A Manchester United icon with a thunderous shot.',
    'Won the Ballon d\'Or in 1966.',
    'England\'s midfield heart in the 1966 triumph.' ] },
  { country: 'Spain', answer: 'Andrés Iniesta', distractors: ['Xavi Hernández', 'David Villa', 'Iker Casillas'], clues: [
    'Joined La Masia at age 12 and barely misplaced a pass since.',
    'Ended his career in Japan with Vissel Kobe.',
    'His goal in the 116th minute won a World Cup final.',
    'Scored the only goal of the 2010 final for Spain.' ] },
  { country: 'Italy', answer: 'Paolo Rossi', distractors: ['Roberto Baggio', 'Alessandro Del Piero', 'Francesco Totti'], clues: [
    'Returned from a two-year ban just before the 1982 World Cup.',
    'Scored a hat-trick against Brazil in 1982.',
    'Won the Golden Boot, Golden Ball and the trophy in the same summer.',
    'Italy\'s 1982 hero.' ] },
  { country: 'France', answer: 'Thierry Henry', distractors: ['David Trezeguet', 'Karim Benzema', 'Antoine Griezmann'], clues: [
    'Started as a winger at Monaco under Arsène Wenger.',
    'Became Arsenal\'s all-time top scorer.',
    'Won the World Cup in 1998 as a 20-year-old.',
    'France\'s record scorer until Giroud passed him.' ] },
  { country: 'Germany', answer: 'Miroslav Klose', distractors: ['Jürgen Klinsmann', 'Thomas Müller', 'Oliver Kahn'], clues: [
    'Born in Poland, celebrated goals with a front flip.',
    'Played in four straight World Cup semi-finals.',
    'Broke Ronaldo\'s record in the 7–1 against Brazil.',
    'The World Cup\'s all-time top scorer with 16.' ] },
  { country: 'Mexico', answer: 'Hugo Sánchez', distractors: ['Rafael Márquez', 'Cuauhtémoc Blanco', 'Javier Hernández'], clues: [
    'Trained as a dentist while starting out at UNAM.',
    'Won five Pichichi trophies in Spain.',
    'Famous for spectacular overhead kicks for Real Madrid.',
    'Mexico\'s greatest ever striker.' ] },
  { country: 'Croatia', answer: 'Davor Šuker', distractors: ['Zvonimir Boban', 'Robert Prosinečki', 'Mario Mandžukić'], clues: [
    'Started at Osijek and Dinamo Zagreb before moving to Spain.',
    'Led the line for Sevilla and Real Madrid in the 1990s.',
    'Won the Golden Boot at France 98.',
    'Fired Croatia to third place at their first World Cup.' ] },
  { country: 'Uruguay', answer: 'Diego Forlán', distractors: ['Luis Suárez', 'Edinson Cavani', 'Enzo Francescoli'], clues: [
    'Struggled at Manchester United before thriving in Spain.',
    'Won two European Golden Shoes with Villarreal and Atlético.',
    'Named best player of the 2010 World Cup.',
    'Uruguay\'s talisman in their 2010 semi-final run.' ] },
  { country: 'Argentina', answer: 'Lionel Messi', distractors: ['Sergio Agüero', 'Ángel Di María', 'Carlos Tevez'], clues: [
    'Left Rosario at 13 for treatment a Spanish club agreed to fund.',
    'Has won the Ballon d\'Or a record eight times.',
    'Finally lifted the World Cup at his fifth attempt.',
    'Argentina\'s captain and the all-time great of his era.' ] },
  { country: 'Senegal', answer: 'Sadio Mané', distractors: ['El Hadji Diouf', 'Kalidou Koulibaly', 'Papa Bouba Diop'], clues: [
    'Left his village against his family\'s wishes to trial in Dakar.',
    'Broke through in Austria with Red Bull Salzburg.',
    'Won the Champions League and Premier League with Liverpool.',
    'Senegal\'s superstar and 2022 African Footballer of the Year runner-up.' ] },
  { country: 'England', answer: 'Gary Lineker', distractors: ['Alan Shearer', 'Michael Owen', 'Wayne Rooney'], clues: [
    'Never received a yellow or red card in his whole career.',
    'Won the Golden Boot at the 1986 World Cup.',
    'Moved from Everton to Barcelona, later starred for Spurs.',
    'England striker turned famous TV presenter.' ] }
];

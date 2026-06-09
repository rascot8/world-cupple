import { Filter } from 'bad-words';

const filter = new Filter();
console.log(typeof filter.list, Array.isArray(filter.list));
if (Array.isArray(filter.list)) {
  console.log("Dictionary length:", filter.list.length);
  const username = "fuck123";
  const containsBadWord = filter.list.some(word => username.toLowerCase().includes(word.toLowerCase()));
  console.log("contains bad word:", containsBadWord);
}

import { RoyalRoadAPI } from '../src/lib';

const api = new RoyalRoadAPI();

(async () => {

try {
  await api.user.login('username', 'password');
  console.log('logged in');
} catch (err) { // RoyalError object.
  console.error(`Something went wrong during login: ${err.message}`);
  return;
}

const content = require('fs').readFileSync('chapter.html', 'utf8');
const chapter = {
  content,
  title: 'My Chapter Title',
  preNote: 'This chapter was published using the royalroadl-api.'
}

try {
  // Fiction ID, chapter object.
  await api.chapter.publish(0, chapter);
  console.log('Chapter published successfully.');
} catch (err) { // Guess which object.
  console.error(`Error while publishing chapter: ${err.message}`);
}

})();

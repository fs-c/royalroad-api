import { RoyalRoadAPI } from '../src/lib';

// To be replaced with the fiction ID you want to post a chapter to.
const fiction = 0;

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
  preNote: 'This chapter was published using the royalroadl-api.',
};

try {
  await api.chapter.publish(fiction, chapter);
  console.log('Chapter published successfully.');
} catch (err) { // Guess which object.
  console.error(`Error while publishing chapter: ${err.message}`);
}

})();

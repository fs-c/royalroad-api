An unofficial API for [royalroadl.com](https://royalroadl.com), written in TypeScript.

```
npm i -s @l1lly/royalroadl-api
```

This is an attempt to write a predictable and consistent wrapper around the  mess that is RRL. Since no official public API is exposed, this module scrapes all data straight from the HTML, which makes it very prone to spontaneous and horrible death.

Documentation can be found on [fsoc.gitlab.com/royalroadl-api](https://fsoc.gitlab.io/royalroadl-api/classes/royalroadapi.html). Note that docs are not generated for every commit, but for every release (minor & major).

## Example usage

__Fetching the top 10 popular fictions__
```javascript
const { RoyalRoadAPI } = require('@l1lly/royalroadl-api');

const api = new RoyalRoadAPI();

(async () => {

const popular = await api.fictions.getPopular();
const titles = popular.slice(10).map((fic) => fic.title);

console.log(`The top 10 popular fictions are: ${titles.join(', ')}`);

})();
```

__Logging on and publishing a chapter__
```javascript
const { RoyalRoadAPI } = require('@l1lly/royalroadl-api');

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
  await api.chapter.publish(0000, chapter);
  console.log('Chapter published successfully.');
} catch (err) { // Guess which object.
  console.error(`Error while publishing chapter: ${err.message}`);
}

})();
```
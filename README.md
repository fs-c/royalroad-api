```
npm i -s @l1lly/royalroadl-api
```

Documentation can be found on [fsoc.gitlab.com/royalroadl-api](https://fsoc.gitlab.io/royalroadl-api/classes/royalroadapi.html).

This is a clone of [node-royalroadl-api@0.4.1](https://github.com/LW2904/node-royalroadl-api/tree/b1f98341551119f2b8423f5ec5f7e17a2423c6fb), which got removed shortly after it was published.

__Changes:__
- Add TypeDoc, generate and publish docs.
- Add Requester class and implement cookie/token logic.
- Implement fiction.publishFiction.

## Example usage

```javascript
const { RoyalRoadAPI } = require('@uninteresting/royalroadl-api');

const api = new RoyalRoadAPI();

(async () => {
  const popular = await api.fictions.getPopular();
  const titles = popular.slice(10).map((fic) => fic.title);

  console.log(`The top 10 popular fictions are: ${titles.join(', ')}`);
})();
```
```
npm i -s node-royalroadl-api
```

Documentation can be found on [fsoc.gitlab.com/royalroadl-api](https://fsoc.gitlab.io/royalroadl-api/classes/royalroadapi.html).

This is a clone of node-royalroadl-api@0.4.1, which got removed shortly after it was published. I mostly just added [typedoc](https://github.com/TypeStrong/typedoc) and generated the documentation.

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
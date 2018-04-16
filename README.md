An unofficial API for [royalroadl.com](https://royalroadl.com), written in TypeScript.

```
npm i -s @l1lly/royalroadl-api
```

This is an attempt to write a predictable and consistent wrapper around the  mess that is RRL. Since no official public API is exposed, this module scrapes all data straight from the HTML, which makes it very prone to spontaneous and horrible death.

Documentation can be found on [fsoc.gitlab.com/royalroadl-api](https://fsoc.gitlab.io/royalroadl-api/classes/royalroadapi.html).

## Example usage

For more examples check out the `/examples` directory.

```javascript
const { RoyalRoadAPI } = require('@l1lly/royalroadl-api');

const api = new RoyalRoadAPI();

(async () => {

const popular = await api.fictions.getPopular();
const titles = popular.slice(10).map((fic) => fic.title);

console.log(`The top 10 popular fictions are: ${titles.join(', ')}`);

})();
```
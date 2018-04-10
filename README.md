```
npm i -s node-royalroadl-api
```

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
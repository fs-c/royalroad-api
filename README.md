An unofficial API for [royalroadl.com](https://royalroadl.com), written in TypeScript.

```
npm i -s @l1lly/royalroadl-api
```

This is an attempt to write a predictable and consistent wrapper around the  mess that is RRL. Since no official public API is exposed, this module scrapes all data straight from the HTML, which makes it very prone to spontaneous and horrible death.

Documentation can be found on [fsoc.gitlab.com/royalroadl-api](https://fsoc.gitlab.io/royalroadl-api/classes/royalroadapi.html). Since this is very barebones and I am rather averse to the idea of adding huge comment blocks to my code, an elaboration on the parts of this module can be found below, in [documentation](#documentation).

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

## Documentation

The module itself exports only a `RoyalRoadAPI` class, which, by itself, as no methods. All functionality is delegated to service classse which are properties of the exported class. This allows for very concise seperation of concerns, and a modular and atomic approach to the development of this module.

All responses and errors are either an instance of a `RoyalResponse` or an extension of it, an `RoyalError`. This is done to easily allow for meta information to be tacked onto responses, and to have a consistent interface between client and API. Note that the `RoyalError` acts similar to the NodeJS `Error`, in that it captures a short stack trace.

All service classes use the same instance of the `Requester`, the class responsible for making HTTP requests and returning their responses. It also does some very early error parsing, attempting to weed out 404s and 403s that are incorrectly sent with a 200 code. By default, it will throw a `RoyalError` if it encounters a status code other than 200 (this can be turned off with the `ignoreStatus` option), or an error is parsed from the page. Also note that, by default, all requests will be sent over HTTPS - this can be turned off by passing a falsy value to the `RoyalRoadAPI` constructor.

The `Requester`s main goal is to keeps track of cookies andto automatically fetch a `__ResponseVerificationToken` often needed for POST requests as a part of anti CSRF measures.

All services are structured in a very similar way: with a `<Service>Class`, and a `<Service>Parser`, which usually exposes a number of static methods used to parse HTML responses.
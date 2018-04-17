An unofficial API for [royalroadl.com](https://royalroadl.com), written in TypeScript.

```
npm i -s @l1lly/royalroadl-api
```

This is an attempt to write a predictable and consistent wrapper around the  mess that is RRL. Since no official public API is exposed, this module scrapes all data straight from the HTML, which makes it very prone to spontaneous and horrible death.

Documentation can be found on [fsoc.gitlab.com/royalroadl-api](https://fsoc.gitlab.io/royalroadl-api/classes/royalroadapi.html). Since this is very barebones and I am rather averse to the idea of adding huge comment blocks to my code, an elaboration on the parts of this module can be found below, in the [about](#about) section.

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

## About

The module itself exports only a `RoyalRoadAPI` class which, by itself, has no methods. All functionality is delegated to service classes which are properties of the `RoyalRoadAPI` instance. This allows for a very concise seperation of concerns, and a modular and atomic approach to both the development, and usage of this module.

### Responses

All responses and errors are either an instance of a `RoyalResponse` or an extension of it - a  `RoyalError`. This is done to easily allow for meta information to be tacked onto responses, and to have a consistent interface between user and module. Note that the `RoyalError` acts similarly to the NodeJS `Error` object, in that it captures and returns a short stack trace.

### Internal requester

All service classes use the same instance of the `Requester`, the class responsible for making HTTP requests and returning their responses. By default, it will throw a `RoyalError` if it encounters a status code other than 200 (this can be disabled with the `ignoreStatus` option). Also note that, by default, all requests will be sent over HTTPS - this can be controlled with the first argument of the `RoyalRoadAPI` constructor.

Since RRL likes to return 200 even when the actual response should be a 404 or 304, the `Requester` will parse the HTML it has gotten (if it got any), and try to read an error from it. If it finds signs that the request has failed, it will throw - this can be disabled with the `ignoreParser` option.

The `Requester`s main goal is to keep track of cookies and to automatically fetch a `__ResponseVerificationToken` often needed for POST requests as a part of anti CSRF measures. This fetching of tokens is disabled by default and can be enabled with the `fetchToken` option.

### Structure

All services are structured in a very similar way: with a `<Service>Class` exposing all relevant methods, and a `<Service>Parser`, which usually exposes a number of static methods used to parse HTML responses.

A quick wrap-up of all the existing services is: 
- `ChapterService`, contains methods for fetching and publishing chapters and chapter comments.
- `FictionService`, returns fiction objects.
- `FictionsService`, methods for fetching all types of fiction lists RRL offers, with their respective levels of detail for an individual fiction.
- `ProfileService`, handling profiles, returns parsed user profiles.
- `UserService`, actions related to the logged-in user like logon, getting their fictions, bookmarks, and notifications.

### Parsing

This uses [cheerio](https://github.com/cheeriojs/cheerio) to parse HTML, which is very forgiving. Even if RRL were to make minor changes to their layout, it would not crash and burn but simply return empty values for information it could not fetch.

It should be obvious, but I cannot stress this enough: this module is entirely dependent on RRL keeping their layout and HTML the same, expect all information to be potentially missing or incorrect.
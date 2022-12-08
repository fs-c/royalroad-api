An unofficial API for [royalroadl.com](https://royalroadl.com), written in TypeScript.

```
npm i -s @fsoc/royalroadl-api
```

This is an attempt to write a predictable and consistent wrapper around the  mess that is RRL. Since no official public API is exposed, this module scrapes all data straight from the HTML, which makes it very prone to spontaneous and horrible death.

Barebones documentation generated from [TypeDoc](http://typedoc.org/) can be found on [fsoc.gitlab.com/royalroadl-api](https://fsoc.gitlab.io/royalroadl-api/classes/royalroadapi.html). You can also build these docs yourself by running `npm run docs` in the root of the project.

A more elaborate description of this package and its functionality (both internal and exposed) can be found further below in the [about](#about) section.

## Example usage

For more examples check out the `/examples` directory.

```javascript
const { RoyalRoadAPI } = require('@l1lly/royalroadl-api');

const api = new RoyalRoadAPI();

(async () => {

const { data } = await api.fictions.getPopular();
const titles = data.slice(10).map((fic) => fic.title);

console.log(`The top 10 popular fictions are: ${titles.join(', ')}`);

})().catch(console.error);
```

## About

The module itself exports only a `RoyalRoadAPI` class which, by itself, has no methods. All functionality is delegated to service classes which are properties of the `RoyalRoadAPI` instance. This allows for a very concise seperation of concerns, and a modular and atomic approach to both the development, and usage of this module.

### Responses

All responses and errors are either an instance of a [`RoyalResponse`](https://fsoc.gitlab.io/royalroadl-api/classes/royalresponse.html) or a [`RoyalError`](https://fsoc.gitlab.io/royalroadl-api/classes/royalerror.html), which extends `RoyalResponse`. This is done to easily allow for meta information to be tacked onto responses, and to have a consistent interface between user and module. Note that the `RoyalError` acts similarly to the NodeJS `Error` object, in that it captures and returns a short stack trace.

For example, a call to `fiction.getFiction()` might yield the following response on success:
```javascript
RoyalResponse {
  data:
   { type: 'Original',
     tags: [ 'Action', 'Adventure', 'Sci-fi', ... 3 more items ],
     stats:
      { pages: 766,
        ratings: 719,
        followers: 2991,
        favorites: 690,
        views: [Object],
        score: [Object] },
     title: 'Paladin',
     image:
      'https://www.royalroadcdn.com/(...)',
     status: 'HIATUS',
     author:
      { name: 'Komikhan',
        title: '',
        avatar:
         'https://www.royalroadcdn.com/(...)',
        id: 66486 },
     warnings: [ 'Gore', 'Profanity' ],
     chapters: [ [Object], [Object], [Object], ... 71 more items ],
     description:
      'When the first derelict alien spacecraft fell to Earth, (...)' },
  success: true,
  timestamp: 1528119296799 }
```
...or on error:
```javascript
RoyalError {
  data:
   { message: 'Page Not Found',
     stack:
      [ 'Error',
        '    at new RoyalError', ... 8 more items ] },
  success: false,
  timestamp: 1528119381034 }
```

### Internal requester

All service classes use the same instance of the `Requester`, the class responsible for making HTTP requests and returning their responses. By default, it will throw a `RoyalError` if it encounters a status code other than 200 (this can be disabled with the `ignoreStatus` option). Also note that, by default, all requests will be sent over HTTPS - this can be controlled with the first argument of the `RoyalRoadAPI` constructor.

Since RRL likes to return 200 even when the actual response should be a 404 or 304, the `Requester` will parse the HTML it has gotten (if it got any), and try to read an error from it. If it finds signs that the request has failed, it will throw - this can be disabled with the `ignoreParser` option.

The `Requester`s main goal is to keep track of cookies and to automatically fetch a `__ResponseVerificationToken` often needed for POST requests as a part of anti CSRF measures. This fetching of tokens is disabled by default and can be enabled with the `fetchToken` option.

### Structure

All services are structured in a very similar way: with a `<Type>Service` exposing all relevant methods, and a `<Type>Parser`, which usually exposes a number of static methods used to parse HTML responses.

A quick wrap-up of all the existing services is: 
- `ChapterService`, contains methods for fetching and publishing chapters and chapter comments.
- `FictionService`, fetching fiction data and reviews.
- `FictionsService`, methods for fetching all types of fiction lists RRL offers, with their respective levels of per fiction detail.
- `ProfileService`, handling profiles, returns parsed user profiles.
- `UserService`, actions related to the logged-in user like logon, getting the users' fictions, bookmarks, or notifications.

### Parsing

This uses [cheerio](https://github.com/cheeriojs/cheerio) to parse HTML, which is a very forgiving parser. This means that even if RRL were to make minor changes to their page layouts, large parts of the API (even those parts responsible for changed areas) would still remain functional.

Therefore, expect properties to be empty or `null`, and know that an error will not be thrown just because some values could not be parsed.
/*
 * Check whether or not a logged in user is a member of the premium usergroup
 * by posting a comment on a given fiction, and reading the premium state from
 * the comment posted.
 */

import { RoyalRoadAPI } from '../src/lib';

// To be replaced with the chapter ID to use for posting verifications.
const chapter = 0;

// To be replaced with the credentials of the user to check state for.
const username = '';
const password = '';

const api = new RoyalRoadAPI();

(async () => {

try {
  await api.user.login(username, password);
  console.log('Logged in.');
} catch (err) { // RoyalError object.
  console.error(`Something went wrong during login: ${err.message}`);
  return;
}

try {
  const ver = String(Date.now());

  // Post a comment to the given chapter with the current date in miliseconds.
  await api.chapter.postComment(chapter, ver);

  // These comments are returned in order, get the newest comment.
  const comment = (await api.chapter.getComments(chapter, 'last')).data
    .reverse()[0];

  // Verify that the comment was posted by us, and get the premium state.
  const premium = comment.content.includes(ver) && comment.author.premium;

  console.log(`Logged in user ${premium ? 'has' : 'does not have'} premium.`);
} catch (err) {
  console.error(`An error occured: ${err.message}`);
}

})();

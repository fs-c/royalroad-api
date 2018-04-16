import { RoyalRoadAPI } from '../src/lib';

const api = new RoyalRoadAPI();

(async () => {

try {
  await api.user.login('username', 'password');
  console.log('logged in');
} catch (err) { // RoyalError object.
  console.error(`Something went wrong during login: ${err.message}`);
  return;
}

try {
  await api.chapter.postComment(1111, String(Date.now()));

  const comments = (await api.chapter.getComments(1111, 'last')).data;
  const premium = comments[comments.length - 1].author.premium;

  console.log(`Logged in user ${premium ? 'has' : 'does not have'} premium.`);
} catch (err) {
  console.error(`An error occured: ${err.message}`);
}

})();

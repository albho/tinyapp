const { urlDatabase } = require("../databases/urlDatabase");

// returns URLs created by logged-in user
function urlsForUser(id) {
  const userURLs = {};

  for (const url in urlDatabase) {
    if (urlDatabase[url].userId === id) {
      userURLs[url] = urlDatabase[url];
    }
  }

  return userURLs;
}

module.exports = { urlsForUser };

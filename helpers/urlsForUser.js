// returns URLs created by logged-in user
function urlsForUser(id, database) {
  const userURLs = {};

  for (const url in database) {
    if (database[url].userId === id) {
      userURLs[url] = database[url];
    }
  }

  return userURLs;
}

module.exports = { urlsForUser };

const { urlDatabase } = require("../databases/urlDatabase");

// check if a short URL belongs to a user
function shortURLbelongsToUser(shortURL, currentUserId) {
  if (urlDatabase[shortURL] && urlDatabase[shortURL].userId === currentUserId) {
    return true;
  }

  return false;
}

module.exports = { shortURLbelongsToUser };

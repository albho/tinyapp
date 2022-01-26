// check if a short URL belongs to a user
function shortURLbelongsToUser(shortURL, currentUserId, database) {
  if (database[shortURL] && database[shortURL].userId === currentUserId) {
    return true;
  }

  return false;
}

module.exports = { shortURLbelongsToUser };

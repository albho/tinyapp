// check if a short URL belongs to a user
const belongsToUser = (shortURL, currentUserId, database) => {
  if (database[shortURL] && database[shortURL].userId === currentUserId) {
    return true;
  }

  return false;
};

module.exports = { belongsToUser };

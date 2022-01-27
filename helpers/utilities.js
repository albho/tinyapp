const bcrypt = require("bcryptjs");

const utilities = (urlDB, userDB) => {
  // check if an user account exists (return user_id if true, else false)
  const getUserId = (email, password) => {
    for (const user in userDB) {
      const passwordsMatch = bcrypt.compareSync(
        password,
        userDB[user].password
      );

      if (userDB[user].email === email && passwordsMatch) {
        return user;
      }
    }

    return null;
  };

  // check if a short URL belongs to a user
  const belongsToUser = (shortURL, currentUserId) => {
    if (urlDB[shortURL] && urlDB[shortURL].userId === currentUserId) {
      return true;
    }

    return false;
  };

  // check if an email exists
  const getUserByEmail = email => {
    for (const user in userDB) {
      if (userDB[user].email === email) {
        return true;
      }
    }

    return null;
  };

  // returns URLs created by logged-in user
  const urlsForUser = id => {
    const userURLs = {};

    for (const url in urlDB) {
      if (urlDB[url].userId === id) {
        userURLs[url] = urlDB[url];
      }
    }

    return userURLs;
  };

  return {
    getUserId,
    belongsToUser,
    getUserByEmail,
    urlsForUser,
  };
};

module.exports = { utilities };

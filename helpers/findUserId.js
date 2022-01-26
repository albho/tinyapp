const { userDatabase } = require("../databases/userDatabase");

// check if an email exists (return user_id if true, else false)
function findUserId(email, password) {
  for (const user in userDatabase) {
    if (
      userDatabase[user].email === email &&
      userDatabase[user].password === password
    ) {
      return user;
    }
  }

  return false;
}

module.exports = { findUserId };

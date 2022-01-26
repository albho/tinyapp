const bcrypt = require("bcryptjs");
const { userDatabase } = require("../databases/userDatabase");

// check if an email exists (return user_id if true, else false)
function findUserId(email, password) {
  for (const user in userDatabase) {
    const passwordsMatch = bcrypt.compareSync(
      password,
      userDatabase[user].password
    );
    if (userDatabase[user].email === email && passwordsMatch) {
      return user;
    }
  }

  return false;
}

module.exports = { findUserId };

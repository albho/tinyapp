const bcrypt = require("bcryptjs");

// check if an email exists (return user_id if true, else false)
const findUserByEmail = (email, password, database) => {
  for (const user in database) {
    const passwordsMatch = bcrypt.compareSync(
      password,
      database[user].password
    );
    if (database[user].email === email && passwordsMatch) {
      return user;
    }
  }

  return false;
};

module.exports = { findUserByEmail };

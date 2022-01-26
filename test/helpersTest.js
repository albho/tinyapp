const { assert } = require("chai");
const bcrypt = require("bcryptjs");
const { findUserByEmail } = require("../helpers/findUserByEmail");

const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

describe("helper function tests", function () {
  describe("#findUserByEmail", function () {
    it("should return a user with valid email and password", function () {
      const actual = findUserByEmail(
        "user@example.com",
        "purple-monkey-dinosaur",
        testUsers
      );
      const expected = "userRandomID";
      assert.deepEqual(actual, expected);
    });

    it("should return null for a non-existent email", function () {
      const actual = findUserByEmail(
        "non-existent-email@example.com",
        "non-existent-password",
        testUsers
      );
      const expected = null;
      assert.deepEqual(actual, expected);
    });
  });
});

const express = require("express");
const app = express();
const PORT = 3000;
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// simulate databases
const urlDatabase = {
  b2xVn2: { userId: "123xyz", longURL: "http://www.lighthouselabs.ca" },
  "9sm5xK": { userId: "456asd", longURL: "http://www.google.com" },
};

const users = {
  "123xyz": { id: "123xyz", email: "lhl@fake.com", password: "lhl" },
  "456asd": { id: "456asd", email: "bing@fake.com", password: "bing" },
};

// simulate generating a 'unique' shortURL
function generateRandomString() {
  const possibleChars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const stringLength = 6;
  let randomString = "";

  for (let i = 0; i < stringLength; i++) {
    let randomIndex = Math.floor(Math.random() * possibleChars.length);
    randomString += possibleChars[randomIndex];
  }

  return randomString;
}

// check if an email exists (return user_id if true, else false)
function findUserId(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return user;
    }
  }

  return false;
}

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

// check if a short URL belongs to a user
function shortURLbelongsToUser(shortURL, currentUserId) {
  if (
    urlDatabase[shortURL] &&
    currentUserId &&
    urlDatabase[shortURL].userId === currentUserId
  ) {
    return true;
  }

  return false;
}

// ROUTE HANDLERS
// home page displaying all shortURLS + longURLS
app.get("/urls", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentUser = users[currentUserId];
  const currentUserUrls = urlsForUser(currentUserId);
  const templateVars = {
    urls: currentUserUrls,
    user: currentUser,
  };

  if (!currentUser) {
    return res.render("redirect", templateVars);
  }

  res.render("urls_index", templateVars);
});

// display form for creating a new shortURL
app.get("/urls/new", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentUser = users[currentUserId];
  const templateVars = { user: currentUser };

  if (!currentUser) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// handle form submission for creating a new shortURL
app.post("/urls", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentUser = users[currentUserId];
  const shortURL = generateRandomString();
  const { longURL } = req.body;

  if (!currentUser) {
    return res.status(403).send("Please log in to continue.");
  }

  urlDatabase[shortURL] = { longURL, userId: currentUserId };
  res.redirect(`/urls/${shortURL}`);
});

// display the newly created shortURL
app.get("/urls/:shortURL", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentUser = users[currentUserId];
  const { shortURL } = req.params;
  const newURL = urlDatabase[shortURL];
  const shortURLauthorId = urlDatabase[shortURL].userId;
  const authorEmail = users[shortURLauthorId].email;
  const templateVars = {
    shortURL,
    newURL,
    authorEmail,
    user: currentUser,
  };

  if (shortURLauthorId !== currentUserId) {
    return res.render("redirect", templateVars);
  }

  res.render("urls_show", templateVars);
});

// redirect to longURL after clicking on a shortURL
app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

// handle submission for updating a shortURL's longURL
app.post("/urls/:shortURL", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentUser = users[currentUserId];
  const { shortURL } = req.params;
  const { longURL } = req.body;

  const templateVars = {
    user: currentUser,
    message: "You cannot edit a short URL that you did not create.",
  };

  if (!shortURLbelongsToUser(shortURL, currentUserId)) {
    return res.render("error_page", templateVars);
  }

  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

// delete a particular shortURL-longURL pair
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentUser = users[currentUserId];
  const { shortURL } = req.params;
  const templateVars = {
    user: currentUser,
    message: "You cannot delete a short URL that you did not create.",
  };

  if (!shortURLbelongsToUser(shortURL, currentUserId)) {
    return res.render("error_page", templateVars);
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// AUTHORIZATION & AUTHENTICATION
// display login form
app.get("/login", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentUser = users[currentUserId];
  const templateVars = {
    user: currentUser,
  };
  res.render("login", templateVars);
});

// handle login submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userId = findUserId(email);

  if (!email || !password) {
    return res.status(403).send("Email or password is empty.");
  }

  if (!userId || password !== users[userId].password) {
    return res.status(403).send("Incorrect email or password.");
  }

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// handle logout (clear user_id cookie)
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// display registration form
app.get("/register", (req, res) => {
  const currentUserId = req.cookies["user_id"];
  const currentUser = users[currentUserId];
  const templateVars = { user: currentUser };

  res.render("register", templateVars);
});

// handle registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(403).send("Email or password is empty.");
  }

  if (findUserId(email)) {
    return res.status(403).send("Email already exists.");
  }

  users[id] = {
    id,
    email,
    password,
  };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

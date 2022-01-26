const express = require("express");
const app = express();
const PORT = 3000;
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// error messages
const ERROR_400 = "Please enter a valid email and password";
const ERROR_401 = "Please log in to continue.";
const ERROR_403 = "Error: Unauthorized.";
const ERROR_404 = "Opps! Page not found.";

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
function generateId() {
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
app.get("/", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];

  if (currentUser) {
    return res.redirect("/urls");
  }

  res.redirect("/login");
});

// home page displaying all of a user's URLs
app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const currentUserUrls = urlsForUser(req.cookies["user_id"]);
  const templateVars = {
    user: currentUser,
    urls: currentUserUrls,
  };

  if (!currentUser) {
    templateVars.message = "Welcome to TinyApp!";
    return res.render("auth_prompt", templateVars);
  }

  res.render("urls_index", templateVars);
});

// display form for creating a new shortURL
app.get("/urls/new", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.redirect("/login");
  }

  const templateVars = { user: currentUser };
  res.render("urls_new", templateVars);
});

// display the newly created shortURL
app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
  };

  if (!currentUser) {
    templateVars.message = ERROR_401;
    return res.status(401).render("auth_prompt", templateVars);
  }

  const { shortURL } = req.params;
  const newURL = urlDatabase[shortURL];
  if (!newURL) {
    templateVars.message = ERROR_404;
    return res.status(404).render("error_page", templateVars);
  }

  const shortURLauthorId = urlDatabase[shortURL].userId;
  if (shortURLauthorId !== req.cookies["user_id"]) {
    templateVars.message = ERROR_403;
    return res.status(403).render("error_page", templateVars);
  }

  const authorEmail = users[shortURLauthorId].email;
  templateVars.shortURL = shortURL;
  templateVars.newURL = newURL;
  templateVars.authorEmail = authorEmail;
  res.render("urls_show", templateVars);
});

// redirect to longURL after clicking on a shortURL
app.get("/u/:shortURL", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
  };

  if (!currentUser) {
    templateVars.message = ERROR_401;
    return res.status(401).render("auth_prompt", templateVars);
  }

  const { shortURL } = req.params;
  if (!urlDatabase[shortURL] || !urlDatabase[shortURL].longURL) {
    templateVars.message = ERROR_404;
    return res.status(404).render("error_page", templateVars);
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// display login form
app.get("/login", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    return res.redirect("/urls");
  }

  const templateVars = { user: currentUser };
  res.render("login", templateVars);
});

// display registration form
app.get("/register", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    return res.redirect("/urls");
  }

  const templateVars = { user: currentUser };
  res.render("register", templateVars);
});

// handle login submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const templateVars = { user: null };

  if (!email || !password) {
    templateVars.message = ERROR_400;
    return res.status(400).render("error_page", templateVars);
  }

  const userId = findUserId(email);
  if (!userId || password !== users[userId].password) {
    templateVars.message = ERROR_400;
    return res.status(400).render("error_page", templateVars);
  }

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// handle logout (clear user_id cookie)
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// handle registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const templateVars = { user: null };

  if (!email || !password) {
    templateVars.message = ERROR_400;
    return res.status(400).render("error_page", templateVars);
  }

  if (findUserId(email)) {
    templateVars.message = ERROR_400;
    return res.status(400).render("error_page", templateVars);
  }

  const id = generateId();
  users[id] = {
    id,
    email,
    password,
  };

  res.cookie("user_id", id);
  res.redirect("/urls");
});

// handle form submission for creating a new shortURL
app.post("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
  };

  if (!currentUser) {
    templateVars.message = ERROR_401;
    return res.status(401).render("auth_prompt", templateVars);
  }

  const shortURL = generateId();
  const { longURL } = req.body;
  urlDatabase[shortURL] = { longURL, userId: req.cookies["user_id"] };
  res.redirect(`/urls/${shortURL}`);
});

// handle submission for updating a shortURL's longURL
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
  };

  if (!currentUser) {
    templateVars.message = ERROR_401;
    return res.status(401).render("auth_prompt", templateVars);
  }

  const { shortURL } = req.params;
  if (!shortURLbelongsToUser(shortURL, req.cookies["user_id"])) {
    templateVars.message = ERROR_403;
    return res.status(403).render("error_page", templateVars);
  }

  const { longURL } = req.body;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

// delete a particular shortURL-longURL pair
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
  };

  if (!currentUser) {
    templateVars.message = ERROR_401;
    return res.status(401).render("auth_prompt", templateVars);
  }

  const { shortURL } = req.params;
  if (!shortURLbelongsToUser(shortURL, req.cookies["user_id"])) {
    templateVars.message = ERROR_403;
    return res.status(403).render("error_page", templateVars);
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

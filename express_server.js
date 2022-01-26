const express = require("express");
const app = express();
const PORT = 3000;
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const { urlDatabase } = require("./databases/urlDatabase");
const { userDatabase } = require("./databases/userDatabase");
const { findUserId } = require("./helpers/findUserId");
const { generateId } = require("./helpers/generateId");
const { shortURLbelongsToUser } = require("./helpers/shortURLbelongsToUser");
const { urlsForUser } = require("./helpers/urlsForUser");
const {
  ERROR_400,
  ERROR_401,
  ERROR_403,
  ERROR_404,
} = require("./helpers/errorMessages");

app.use(
  cookieSession({
    name: "user_id",
    keys: [process.env.SECRET_KEY],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// ROUTE HANDLERS
app.get("/", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];

  if (currentUser) {
    return res.redirect("/urls");
  }

  res.redirect("/login");
});

// render home page - list all of a user's URLs
app.get("/urls", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const currentUserUrls = urlsForUser(req.session.user_id);
  const templateVars = { user: currentUser, urls: currentUserUrls };

  if (!currentUser) {
    templateVars.message = "Welcome to TinyApp!";
    return res.render("auth_prompt", templateVars);
  }

  res.render("urls_index", templateVars);
});

// render page for creating a new shortURL
app.get("/urls/new", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];

  if (!currentUser) {
    return res.redirect("/login");
  }

  const templateVars = { user: currentUser };
  res.render("urls_new", templateVars);
});

// render the newly created shortURL
app.get("/urls/:shortURL", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };

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
  if (shortURLauthorId !== req.session.user_id) {
    templateVars.message = ERROR_403;
    return res.status(403).render("error_page", templateVars);
  }

  const authorEmail = userDatabase[shortURLauthorId].email;
  const newTemplateVars = { ...templateVars, shortURL, newURL, authorEmail };
  res.render("urls_show", newTemplateVars);
});

// redirect to longURL after clicking on a shortURL
app.get("/u/:shortURL", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };

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

// login page
app.get("/login", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];

  if (currentUser) {
    return res.redirect("/urls");
  }

  const templateVars = { user: currentUser };
  res.render("login", templateVars);
});

// registration page
app.get("/register", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];

  if (currentUser) {
    return res.redirect("/urls");
  }

  const templateVars = { user: currentUser };
  res.render("register", templateVars);
});

// log user in
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const templateVars = { user: null };

  if (!email || !password) {
    templateVars.message = ERROR_400;
    return res.status(400).render("error_page", templateVars);
  }

  const userId = findUserId(email, password);
  if (!userId) {
    templateVars.message = ERROR_400;
    return res.status(400).render("error_page", templateVars);
  }

  // res.cookie("user_id", userId);
  req.session.user_id = userId;
  res.redirect("/urls");
});

// log user out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// register new user
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const templateVars = { user: null };

  if (!email || !password) {
    templateVars.message = ERROR_400;
    return res.status(400).render("error_page", templateVars);
  }

  if (findUserId(email, password)) {
    templateVars.message = ERROR_400;
    return res.status(400).render("error_page", templateVars);
  }

  const userId = generateId();
  const hashedPassword = bcrypt.hashSync(password, 10);
  userDatabase[userId] = { email, id: userId, password: hashedPassword };
  // res.cookie("user_id", id);
  req.session.user_id = userId;
  res.redirect("/urls");
});

// create a new shortURL
app.post("/urls", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: null };

  if (!currentUser) {
    templateVars.message = ERROR_401;
    return res.status(401).render("auth_prompt", templateVars);
  }

  const shortURL = generateId();
  const { longURL } = req.body;
  urlDatabase[shortURL] = { longURL, userId: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

// update a shortURL's longURL
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };

  if (!currentUser) {
    templateVars.message = ERROR_401;
    return res.status(401).render("auth_prompt", templateVars);
  }

  const { shortURL } = req.params;
  if (!shortURLbelongsToUser(shortURL, req.session.user_id)) {
    templateVars.message = ERROR_403;
    return res.status(403).render("error_page", templateVars);
  }

  const { longURL } = req.body;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

// delete a particular shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };

  if (!currentUser) {
    templateVars.message = ERROR_401;
    return res.status(401).render("auth_prompt", templateVars);
  }

  const { shortURL } = req.params;
  if (!shortURLbelongsToUser(shortURL, req.session.user_id)) {
    templateVars.message = ERROR_403;
    return res.status(403).render("error_page", templateVars);
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// error handling
app.get("*", (req, res) => {
  const templateVars = { user: null, message: ERROR_404 };
  return res.status(404).render("error_page", templateVars);
});

// start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

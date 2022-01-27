const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const { urlDatabase } = require("./databases/urlDatabase");
const { userDatabase } = require("./databases/userDatabase");
const { utilities } = require("./helpers/utilities");
const { getUserId, belongsToUser, getUserByEmail, urlsForUser } = utilities(
  urlDatabase,
  userDatabase
);

const { generateId } = require("./helpers/generateId");
const { redirectUser, redirectError } = require("./helpers/resRedirects");
const {
  ERROR_MSG_EMPTY_FIELD,
  ERROR_MSG_INCORRECT_AUTH,
  ERROR_MSG_EMAIL_EXISTS,
  ERROR_MSG_NOT_AUTHORIZED,
  ERROR_MSG_NOT_FOUND,
} = require("./helpers/errorMessages");

app.use(
  cookieSession({
    name: "user_id",
    keys: ["terrible_secret"],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// home page
app.get("/", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];

  if (!currentUser) {
    return res.redirect("/login");
  }

  return res.redirect("/urls");
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

  return res.render("urls_index", templateVars);
});

// render page for creating a new shortURL
app.get("/urls/new", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];

  if (!currentUser) {
    return res.redirect("/login");
  }

  const templateVars = { user: currentUser };
  return res.render("urls_new", templateVars);
});

// render the newly created shortURL
app.get("/urls/:shortURL", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };

  if (!currentUser) {
    return redirectUser(templateVars, res);
  }

  // if shortURL does not exist, render error page
  const { shortURL } = req.params;
  const newURL = urlDatabase[shortURL];
  if (!newURL) {
    return redirectError(templateVars, res, 404, ERROR_MSG_NOT_FOUND);
  }

  // if shortURL was not created by the current user, render error page
  const shortURLauthorId = urlDatabase[shortURL].userId;
  if (shortURLauthorId !== req.session.user_id) {
    return redirectError(templateVars, res, 403, ERROR_MSG_NOT_AUTHORIZED);
  }

  const authorEmail = userDatabase[shortURLauthorId].email;
  const newTemplateVars = { ...templateVars, shortURL, newURL, authorEmail };
  return res.render("urls_show", newTemplateVars);
});

// redirect to longURL after clicking on a shortURL
app.get("/u/:shortURL", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };

  // if requested shortURL (or longURL) does not exist in db, render error page
  const { shortURL } = req.params;
  if (!urlDatabase[shortURL] || !urlDatabase[shortURL].longURL) {
    return redirectError(templateVars, res, 404, ERROR_MSG_NOT_FOUND);
  }

  const longURL = urlDatabase[shortURL].longURL;
  return res.redirect(longURL);
});

// login page
app.get("/login", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];

  if (currentUser) {
    return res.redirect("/urls");
  }

  const templateVars = { user: currentUser };
  return res.render("login", templateVars);
});

// registration page
app.get("/register", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];

  if (currentUser) {
    return res.redirect("/urls");
  }

  const templateVars = { user: currentUser };
  return res.render("register", templateVars);
});

// log user in
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const templateVars = { user: null };

  if (!email || !password) {
    return redirectError(templateVars, res, 400, ERROR_MSG_EMPTY_FIELD);
  }

  const userId = getUserId(email, password);
  if (!userId) {
    return redirectError(templateVars, res, 400, ERROR_MSG_INCORRECT_AUTH);
  }

  req.session.user_id = userId;
  return res.redirect("/urls");
});

// log user out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.clearCookie("user_id.sig");
  return res.redirect("/urls");
});

// register new user
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const templateVars = { user: null };

  if (!email || !password) {
    return redirectError(templateVars, res, 400, ERROR_MSG_EMPTY_FIELD);
  }

  if (getUserByEmail(email)) {
    return redirectError(templateVars, res, 400, ERROR_MSG_EMAIL_EXISTS);
  }

  // create new user
  const userId = generateId();
  const hashedPassword = bcrypt.hashSync(password, 10);
  userDatabase[userId] = { email, id: userId, password: hashedPassword };
  req.session.user_id = userId;
  return res.redirect("/urls");
});

// create a new shortURL
app.post("/urls", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: null };

  if (!currentUser) {
    return redirectUser(templateVars, res);
  }

  // create new shortURL
  const shortURL = generateId();
  const { longURL } = req.body;
  urlDatabase[shortURL] = { longURL, userId: req.session.user_id };
  return res.redirect(`/urls/${shortURL}`);
});

// update a shortURL's longURL
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };

  if (!currentUser) {
    return redirectUser(templateVars, res);
  }

  // restrict user from updating a shortURL that they did not create
  const { shortURL } = req.params;
  if (!belongsToUser(shortURL, req.session.user_id)) {
    return redirectError(templateVars, res, 403, ERROR_MSG_NOT_AUTHORIZED);
  }

  const { longURL } = req.body;
  urlDatabase[shortURL].longURL = longURL;
  return res.redirect("/urls");
});

// delete a particular shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };

  if (!currentUser) {
    return redirectUser(templateVars, res);
  }

  // restrict user from deleting a shortURL that they did not create
  const { shortURL } = req.params;
  if (!belongsToUser(shortURL, req.session.user_id)) {
    return redirectError(templateVars, res, 403, ERROR_MSG_NOT_AUTHORIZED);
  }

  delete urlDatabase[shortURL];
  return res.redirect("/urls");
});

// error handling
app.get("*", (req, res) => {
  const currentUser = userDatabase[req.session.user_id];
  const templateVars = { user: currentUser };
  return redirectError(templateVars, res, 404, ERROR_MSG_NOT_FOUND);
});

// start server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

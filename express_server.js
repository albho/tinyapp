const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// simulate databases
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {};

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

// check if an email exists
function emailExists(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }

  return false;
}

// ROUTE HANDLERS
// home page displaying all shortURLS + longURLS
app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    urls: urlDatabase,
    user: currentUser,
  };

  res.render("urls_index", templateVars);
});

// display form for creating a new shortURL
app.get("/urls/new", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = { user: currentUser };

  res.render("urls_new", templateVars);
});

// handle form submission for creating a new shortURL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// display the newly created shortURL
app.get("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL],
    user: currentUser,
  };

  res.render("urls_show", templateVars);
});

// redirect to longURL after clicking on a shortURL
app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});

// handle submission for updating a shortURL's longURL
app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = req.body;

  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

// delete a particular shortURL-longURL pair
app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// AUTHORIZATION & AUTHENTICATION
// handle username submission
app.post("/login", (req, res) => {
  const { username } = req.body;

  res.cookie("username", username);
  res.redirect("/urls");
});

// handle logout (clear username cookie)
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// display registration form
app.get("/register", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = { user: currentUser };

  res.render("register", templateVars);
});

// handle registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(400).send("Email or password is empty.");
  }

  if (emailExists(email)) {
    return res.status(400).send("Email already exists.");
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

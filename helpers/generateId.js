// simulate generating a 'unique' id (for shortURLs and user ids)
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

module.exports = { generateId };

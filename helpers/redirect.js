const redirectUser = (templateVars, res, errMsg) => {
  templateVars.message = errMsg;
  return res.status(401).render("auth_prompt", templateVars);
};

const redirectError = (templateVars, res, statusCode, errMsg) => {
  templateVars.message = errMsg;
  return res.status(statusCode).render("error_page", templateVars);
};

module.exports = { redirectUser, redirectError };

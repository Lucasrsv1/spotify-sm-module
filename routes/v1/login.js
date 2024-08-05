const loginRoutes = require("express").Router();

const controller = require("../../controllers/login");

loginRoutes.get("/", controller.login);
loginRoutes.get("/callback", controller.loginCallback);

module.exports = loginRoutes;

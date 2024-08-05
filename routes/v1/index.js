const v1 = require("express").Router();

const generalRoutes = require("./general");
const loginRoutes = require("./login");

v1.use("/", generalRoutes);
v1.use("/login", loginRoutes);

module.exports = v1;

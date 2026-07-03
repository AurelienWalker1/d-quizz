const monday = require("./questions/monday");
const tuesday = require("./questions/tuesday");
const wednesday = require("./questions/wednesday");
const thursday = require("./questions/thursday");
const friday = require("./questions/friday");
const saturday = require("./questions/saturday");
const sunday = require("./questions/sunday");

const questions = {
  sunday,
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
};

module.exports = questions;
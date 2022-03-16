"use strict";
const axios = require("axios");

const request = axios.create({
  baseURL: process.env.BC_CLI_BASEURL
    ? process.env.BC_CLI_BASEURL
    : "http://bc.cli.server:7001",
  timeout: 5000,
});
axios.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(
  function (response) {
    console.log(response,"==========");
    return response.data;
  },
  function (error) {
    console.log(error,"==========");
    return Promise.reject(error);
  }
);

module.exports = request;

/* eslint-disable no-console */
const axios = require('axios');
const btoa = require('btoa');
const { logger } = require('./logger');
const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  COGNITO_REDIRECT_URI,
  DISCORD_API_URL
  // DISCORD_LOGIN_URL
} = require('./config');

const { discordEndpoints } = require('./endpoints');

const check = response => {
  if (response.data) {
    if (response.data.error) {
      throw new Error(
        `Discord API responded with a failure: ${response.data.error}, ${
          response.data.error_description
        }`
      );
    } else if (response.status === 200) {
      return response.data;
    }
  }
  throw new Error(
    `Discord API responded with a failure: ${response.status} (${
      response.statusText
    })`
  );
};

const discordGet = (url, accessToken) =>
  axios({
    method: 'GET',
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

module.exports = () => {
  return {
    getAuthorizeUrl: (client_id, scope, state, response_type) => {
      const cleanScope = scope
        .split(' ')
        .filter(i => i !== 'openid')
        .map(i => i.split("/").pop()) // For compatibility with cognito custom scopes
        .join(' ');
      return `${
        discordEndpoints.oauthAuthorize
      }?client_id=${client_id}&scope=${encodeURIComponent(
        cleanScope
      )}&state=${state}&response_type=${response_type}`;
    },
    getUserDetails: accessToken =>
      discordGet(discordEndpoints.userDetails, accessToken).then(check),
    getUserEmails: accessToken =>
      discordGet(discordEndpoints.userEmails, accessToken).then(check),
    getToken: code => {
      const request = {
        method: 'POST',
        url: `${discordEndpoints.oauthToken}`,
        headers: {
          Authorization: `Basic ${btoa(
            `${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`,
          )}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: `grant_type=authorization_code&redirect_uri=${COGNITO_REDIRECT_URI}&code=${code}&client_id=${DISCORD_CLIENT_ID}&client_secret=${DISCORD_CLIENT_SECRET}`
      }
      logger.info({
        message: "Discord getToken request",
        component: "github.js",
        operation: "getToken",
        request
      })
      return axios(request).then((response) => {
        logger.info({
          message: "Discord getToken response",
          component: "github.js",
          operation: "getToken",
          response: {
            headers: response.headers,
            body: response.data.toString()
          }
        })
        return check(response);
      });
    }
  };
};

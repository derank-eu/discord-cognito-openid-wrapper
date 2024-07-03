const { DISCORD_API_URL } = require('./config');
export const getApiEndpoints = (apiBaseUrl = DISCORD_API_URL) => ({
  userDetails: `${apiBaseUrl}/api/users/@me`,
  userEmails: `${apiBaseUrl}/api/users/@me`,
  oauthToken: `${apiBaseUrl}/api/oauth2/token`,
  oauthAuthorize: `${apiBaseUrl}/oauth2/authorize`
});

export const discordEndpoints = getApiEndpoints();
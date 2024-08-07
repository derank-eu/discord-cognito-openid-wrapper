const { NumericDate } = require('./helpers');
const crypto = require('./crypto');
const github = require('./github');
const config = require('./config');
const { logger } = require('./logger');

const getJwks = () => ({ keys: [crypto.getPublicKey()] });

const getUserInfo = (accessToken) => {
  logger.info({
    component: 'openid',
    function: 'getUserInfo',
    message: 'getUserDetails request',
  });

  return Promise.all([
    github()
      .getUserDetails(accessToken)
      .then((userDetails) => {
        logger.info({
          component: 'openid',
          function: 'getUserInfo',
          message: 'getUserDetails result',
          success: true,
        });
        // Here we map the github user response to the standard claims from
        // OpenID. The mapping was constructed by following
        // https://developer.github.com/v3/users/
        // and http://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
        const claims = {
          sub: `${userDetails.id}`, // OpenID requires a string
          name: `${userDetails.username}#${userDetails.discriminator}`,
          preferred_username: userDetails.username,
          profile: 'https://discordapp.com',
          picture: `https://cdn.discordapp.com/avatars/${userDetails.id}/${userDetails.avatar}.png`,
          website: 'https://discord.com',
          updated_at: NumericDate(
            // OpenID requires the seconds since epoch in UTC
            new Date(Date.parse(userDetails.updated_at)),
          ),
        };
        return claims;
      }),
    github()
      .getUserEmails(accessToken)
      .then((userData) => {
        const primaryEmail = userData.email;
        if (primaryEmail === undefined) {
          throw new Error('User did not have a primary email address');
        }
        const claims = {
          email: primaryEmail.email,
          email_verified: userData.verified,
        };
        return claims;
      }),
  ]).then((claims) =>
    claims.reduce((acc, claim) => ({ ...acc, ...claim }), {}),
  );
};

const getAuthorizeUrl = (client_id, scope, state, response_type) => {
  return github().getAuthorizeUrl(client_id, scope, state, response_type);
};

const getTokens = (code, state, host) => {
  return github()
    .getToken(code, state)
    .then((discordToken) => {
      // GitHub returns scopes separated by commas
      // But OAuth wants them to be spaces
      // https://tools.ietf.org/html/rfc6749#section-5.1
      // Also, we need to add openid as a scope,
      // since GitHub will have stripped it
      const scope = `openid ${discordToken.scope.replace(',', ' ')}`;

      // ** JWT ID Token required fields **
      // iss - issuer https url
      // aud - audience that this token is valid for (GITHUB_CLIENT_ID)
      // sub - subject identifier - must be unique
      // ** Also required, but provided by jsonwebtoken **
      // exp - expiry time for the id token (seconds since epoch in UTC)
      // iat - time that the JWT was issued (seconds since epoch in UTC)

      return new Promise((resolve) => {
        const payload = {
          // This was commented because Cognito times out in under a second
          // and generating the userInfo takes too long.
          // It means the ID token is empty except for metadata.
          //  ...userInfo,
        };

        const idToken = crypto.makeIdToken(payload, host);
        const tokenResponse = {
          ...discordToken,
          scope,
          id_token: idToken,
        };

        resolve(tokenResponse);
      });
    });
};

const getConfigFor = (host) => ({
  issuer: `https://${host}`,
  authorization_endpoint: `https://${host}/authorize`,
  token_endpoint: `https://${host}/token`,
  token_endpoint_auth_methods_supported: [
    'client_secret_basic',
    'private_key_jwt',
  ],
  token_endpoint_auth_signing_alg_values_supported: ['RS256'],
  userinfo_endpoint: `https://${host}/userinfo`,
  // check_session_iframe: 'https://server.example.com/connect/check_session',
  // end_session_endpoint: 'https://server.example.com/connect/end_session',
  jwks_uri: `https://${host}/.well-known/jwks.json`,
  // registration_endpoint: 'https://server.example.com/connect/register',
  scopes_supported: config.SCOPES_SUPPORTED.split(','),
  response_types_supported: [
    'code',
    'code id_token',
    'id_token',
    'token id_token',
  ],

  subject_types_supported: ['public'],
  userinfo_signing_alg_values_supported: ['none'],
  id_token_signing_alg_values_supported: ['RS256'],
  request_object_signing_alg_values_supported: ['none'],
  display_values_supported: ['page', 'popup'],
  claims_supported: config.CLAIMS_SUPPORTED.split(','),
});

module.exports = {
  getTokens,
  getUserInfo,
  getJwks,
  getConfigFor,
  getAuthorizeUrl,
};

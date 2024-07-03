const openid = require('../openid');
const { logger } = require('../logger');

module.exports = respond => ({
  authorize: (client_id, scope, state, response_type) => {
    logger.info({
      endpoint: "authorize",
      message: "authorize request",
      client_id, scope, state, response_type
    })
    const authorizeUrl = openid.getAuthorizeUrl(
      client_id,
      scope,
      state,
      response_type
    );
    logger.info({
      endpoint: "authorize",
      message: "authorize request URL",
      authorizeUrl
    })
    respond.redirect(authorizeUrl);
  },
  userinfo: tokenPromise => {
    tokenPromise
      .then((token) => openid.getUserInfo(token))
      .then((userInfo) => {
        logger.info({
          endpoint: "userinfo",
          message: "userinfo endpoint success result",
          userInfo
        })
        respond.success(userInfo);
      })
      .catch((error) => {
        logger.error({
          endpoint: "userinfo",
          message: "userinfo endpoint error result",
          error
        })
        respond.error(error);
      });
  },
  token: (code, state, host) => {
    logger.info({
      endpoint: "token",
      message: "token request",
      code, state, host
    })

    if (code) {
      openid
        .getTokens(code, state, host)
        .then(tokens => {
          logger.info({
            endpoint: "token",
            message: "token success"
          })
          respond.success(tokens);
        })
        .catch(error => {
          logger.error({
            endpoint: "token",
            message: "token endpoint error result",
            error
          })
          respond.error(error);
        });
    } else {
      logger.error({
        endpoint: "token",
        message: "token endpoint error result",
        error: new Error('No code supplied')
      })
      respond.error(new Error('No code supplied'));
    }
  },
  jwks: () => respond.success(openid.getJwks()),
  openIdConfiguration: host => {
    logger.info({
      endpoint: "jwks",
      message: "jwks request",
      host
    })
    const config = openid.getConfigFor(host);
    logger.info({
      endpoint: "jwks",
      message: "jwks result",
      config
    })
    respond.success(config);
  }
});

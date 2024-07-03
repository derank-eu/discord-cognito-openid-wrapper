#!/bin/bash -eu

# Variables always required
export DISCORD_CLIENT_ID=# <DISCORD OAuth App Client ID>
export DISCORD_CLIENT_SECRET=# <DISCORD OAuth App Client Secret>
export COGNITO_REDIRECT_URI=# https://<Your Cognito Domain>/oauth2/idpresponse

export DISCORD_API_URL=https://discord.com
export SCOPES_SUPPORTED="openid,read:user,user:email"
export CLAIMS_SUPPORTED="sub,name,preferred_username,profile,picture,website,email,email_verified,updated_at,iss,aud"

# Variables required if deploying with API Gateway / Lambda
export BUCKET_NAME=# An S3 bucket name to use as the deployment pipeline
export STACK_NAME=
export REGION=# AWS region to deploy the stack and bucket in

# Variables required if deploying a node http server
# export PORT=# <Port to start the server on>

const { CognitoJwtVerifier } = require('aws-jwt-verify');

const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USERPOOL_ID,
  tokenUse: 'id',
  clientId: COGNITO_WEB_CLIENT_ID,
});

const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};

  authResponse.principalId = principalId;
  if (effect && resource) {
    let policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Resource: resource,
          Effect: effect,
          Action: 'execute-api:Invoke',
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }

  authResponse.context = {
    foo: 'bar',
  };
  console.log(JSON.stringify(authResponse));
  return authResponse;
};

exports.handler = async (event, context, cb) => {
  const token = event.authorizationToken;
  console.log(token);

  try {
    const payload = await jwtVerifier.verify(token);
    console.log(JSON.stringify(payload));
    cb(null, generatePolicy('user', 'Allow', event.methodArn));
  } catch (err) {
    cb('Error: Invalid Token');
  }
  // validate jwt code
  // switch (token) {
  //   case 'allow':
  //     cb(null, generatePolicy('user', 'Allow', event.methodArn));
  //     break;
  //   case 'deny':
  //     cb(null, generatePolicy('user', 'Deny', event.methodArn));
  //   default:
  //     cb('Error: Invalid Token');
  // }
};

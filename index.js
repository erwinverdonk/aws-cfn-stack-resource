#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2));
const pjson = require(__dirname + '/package.json');

process.env.AWS_DEFAULT_REGION = argv.region || 'us-east-1';
process.env.AWS_REGION = process.env.AWS_DEFAULT_REGION

if(!argv['bucket-name']){
  console.error('No "bucket-name" parameter provided as destination for the Lambda package.');
  process.exit();
}

const run = () => {
  const AwsLambdaUploadDeploy = require(
    '@erwinverdonk/aws-lambda-upload-deploy'
  ).AwsLambdaUploadDeploy;

  const functionName = (
    `AwsCfnStackResource-${pjson.version.replace(/\./g, '-')}`
  );

  AwsLambdaUploadDeploy({
    functionName,
    sourcePath: `${__dirname}/dist`,
    version: pjson.version,
    s3: {
      bucketName: `${argv['bucket-name']}-${process.env.AWS_REGION}`
    },
    settings: {
      runtime: 'nodejs8.10',
      memory: 128,
      timeout: 300,
      permissions: [
        {
          effect: 'Allow',
          action: ['*'],
          resource: ['*']
        }
      ]
    }
  })
  .start();
}

// When a Role Arn is provided we try to assume the role before proceeding.
if(argv['role-arn']){
  const AWS = require('aws-sdk');
  const assumeRole = require('aws-assume-role').assumeRole;

  assumeRole({
    roleArn: argv['role-arn']
  })
  .then(_ => {
    // Setting temporary credentials as the credentials to use.
    process.env.AWS_ACCESS_KEY_ID = _.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = _.secretAccessKey;
    process.env.AWS_SESSION_TOKEN = _.sessionToken;

    AWS.config = new AWS.Config();

    // Run the deploy logic
    run();
  });
} else {
  run();
}

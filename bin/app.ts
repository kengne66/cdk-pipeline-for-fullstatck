#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';

import { fullStackPipeline } from '../lib/fullstack-pipeline-stack';




const uatUiPackageName = 'angular-website-example'

const prodUiPackageName = 'angular-website-example'

const devUiPackageName = 'angular-website-example'




const uatLambdaPackageName = 'express-lambda'

const prodLambdaPackageName = 'express-lambda'

const devLambdaPackageName = 'express-lambda'




const deploymentEnv = 'uat'




let uiPackageName = "";

let lambdaPackageName = "";




function deployParameters() {

  const deployEnv = deploymentEnv




  if (deployEnv == 'uat') {

    uiPackageName = uatUiPackageName;

    lambdaPackageName = uatLambdaPackageName;

  }

  else if (deployEnv == 'prod') {

    uiPackageName = prodUiPackageName;

    lambdaPackageName = prodLambdaPackageName;

  }

  else {

    uiPackageName = devUiPackageName

    lambdaPackageName = devLambdaPackageName;

  }




}






const app = new cdk.App();




new fullStackPipeline(app, 'fullStackPipeline', {

  env: {

    account: ('969829910614'),

    region: ('us-east-1'),

  },

 // DeploymentEnv: deploymentEnv,

  uiPackage: uiPackageName,

  lambdaPackage: lambdaPackageName,




  //vpcID: 'abcd',

  //vpcSubnets: ['a','b','c'],

  //availabiltyZone: ['a','b','c']

});




app.synth();
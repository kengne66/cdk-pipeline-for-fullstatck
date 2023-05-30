#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { fullStackPipeline } from '../lib/fullstack-pipeline-stack';


//https://github.com/findy-network/findy-agent-infra/blob/master/aws-ecs/lib/constants.ts

const app = new cdk.App();

new fullStackPipeline(app, 'fullStackPipeline', {
  env: {
    account: '673233218795',
    region: 'us-east-1',
  }
});

app.synth();
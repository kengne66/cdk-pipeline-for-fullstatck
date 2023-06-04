import * as cdk from 'aws-cdk-lib';

import { Construct } from "constructs";

import { LambdaStack } from '../lambda-stack';

import { CfnVPCCidrBlock, VpcEndpoint } from 'aws-cdk-lib/aws-ec2';

import { VpcSubnetGroupType } from 'aws-cdk-lib/cx-api';



import { SecretValue, Environment } from 'aws-cdk-lib';


import { cognitoStack } from '../cognito-stack'



export interface LambdastageProps extends cdk.StageProps {

  readonly stageName: string;

  //readonly vpcID: string

  //readonly vpcSubnets: string[]

  ///readonly availabiltyZone: string[]

}




export class LambdaAppStage extends cdk.Stage {

    readonly uatEnv: cdk.Environment;

    constructor(scope: Construct, id: string, props: LambdastageProps) {

      super(scope, id, props);




      this.uatEnv = {

        region: 'us-east-1',

        account: '969829910614'

      };



      const cognitostack = new cognitoStack(this, `props.{stageName}-cognitoStack`, {
        stage: props.stageName,
        env: this.uatEnv
      })





      const lambdaStack = new LambdaStack(this, 'LambdaStack', {

        stageName: props.stageName,

        env: this.uatEnv

      });  

      //lambdaStack.addDependency(CognitoStack)

    }

   

}
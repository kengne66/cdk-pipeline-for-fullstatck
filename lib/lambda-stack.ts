//import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs";
import { CfnOutput, CfnParameter, Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from  "aws-cdk-lib/aws-lambda"
import { LambdaDeploymentConfig, LambdaDeploymentGroup } from "aws-cdk-lib/aws-codedeploy";
import { Bucket } from "aws-cdk-lib/aws-s3";


interface LambdaStackProps extends StackProps {
  stageName: string
}

export class LambdaStack extends Stack {
  public readonly servicecode: 
   lambda.CfnParametersCode;
  public readonly serviceEnpointOutput: CfnOutput;
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    this.servicecode = Code.fromCfnParameters();

    const Lambda = new Function(this, "serviceLambda", {
      runtime: Runtime.NODEJS_14_X,
      handler: "scr/lambda.handler",
      code: Code.fromAsset('../lambda-code/src/lambda'),
      functionName: `serviceLambda${props.stageName}`,
      description: `Generated on ${new Date().toISOString}`
    });

    const alias = new lambda.Alias(this, "ServiceLambdaAlias", {
      version: Lambda.currentVersion,
      aliasName: `serviceLambdaAlias${props.stackName}`

    })
    


  }

}

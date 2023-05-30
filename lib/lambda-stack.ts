//import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs";
import { CfnOutput, CfnParameter, Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from  "aws-cdk-lib/aws-lambda"
import { LambdaDeploymentConfig, LambdaDeploymentGroup } from "aws-cdk-lib/aws-codedeploy";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy, Duration, DockerImage } from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { RetentionDays } from "aws-cdk-lib/aws-logs";

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
/*
    const bucket = new Bucket(this, `${this.stackName}-kengne01-lambdabucket`, {
      bucketName: `${this.stackName}-kengne01-lambdabucket`,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      removalPolicy: RemovalPolicy.DESTROY,
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      autoDeleteObjects: true
    });

    const policyStatement = new PolicyStatement();
    policyStatement.addActions("s3:GetObject*");
    policyStatement.addResources(`${bucket.bucketArn}/*`);

    policyStatement.addAnyPrincipal()
    bucket.addToResourcePolicy(policyStatement);
    
    const listPolicyStatement = new PolicyStatement();
    listPolicyStatement.addActions("s3:ListBucket");
    listPolicyStatement.addResources(bucket.bucketArn);
    listPolicyStatement.addAnyPrincipal()
    bucket.addToResourcePolicy(listPolicyStatement);

    const putPolicyStatement = new PolicyStatement();
    putPolicyStatement.addActions("s3:PutObject");
    putPolicyStatement.addResources(`${bucket.bucketArn}/*`);
    putPolicyStatement.addAnyPrincipal()
    bucket.addToResourcePolicy(putPolicyStatement);


    new s3deploy.BucketDeployment(this, `${id}-deployment`, {
      sources: [s3deploy.Source.asset('../lambda-code/src/')],
      destinationBucket: bucket,
      logRetention: RetentionDays.ONE_MONTH,
    });

*/

    const Lambda = new Function(this, "serviceLambda", {
      runtime: Runtime.NODEJS_14_X,
      handler: "scr/lambda.handler",
      code: Code.fromAsset('../lambda-code'),
      functionName: `serviceLambda${props.stageName}`,
      description: `Generated on ${new Date().toISOString}`
    });

    const alias = new lambda.Alias(this, "ServiceLambdaAlias", {
      version: Lambda.currentVersion,
      aliasName: `serviceLambdaAlias${props.stackName}`

    })
    


  }

}

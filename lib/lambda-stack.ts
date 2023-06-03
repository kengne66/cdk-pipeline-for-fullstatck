import * as cdk from 'aws-cdk-lib';

import { Construct} from 'constructs';

//import { BrazilPackage, DeploymentStack, DeploymentStackProps } from '@amzn/pipelines';

import {CfnOutput, Duration} from 'aws-cdk-lib';

//import { LambdaAsset } from '@amzn/pipelines';

import {Alias, Function, Runtime, LayerVersion} from 'aws-cdk-lib/aws-lambda';

import {aws_lambda} from "aws-cdk-lib"

import {IVpc, SecurityGroup} from "aws-cdk-lib/aws-ec2";

import * as ec2 from 'aws-cdk-lib/aws-ec2'

import * as apigw from "aws-cdk-lib/aws-apigateway";

import * as cognito from 'aws-cdk-lib/aws-cognito'

import * as lambda from "aws-cdk-lib/aws-lambda";

import {createLambda, createLambdaRole, createSecurityGroup, LambdaIntegrationOnePermissionOnly} from './infrastructure-core-stack'

import {createRole} from "aws-cdk-lib/aws-autoscaling-hooktargets";

import * as apigateway from "aws-cdk-lib/aws-apigateway";

import {constants} from "http2";

import {HttpMethod} from "aws-cdk-lib/aws-events";

import * as iam from 'aws-cdk-lib/aws-iam';

import {ServicePrincipal} from "aws-cdk-lib/aws-iam";

import { CfnParameter, Stack, StackProps } from "aws-cdk-lib";

//import {int} from "aws-sdk/clients/datapipeline";






export interface LambdaProps extends StackProps {

    readonly stageName: string;

    //readonly vpcID: string;

   // readonly vpcSubnets: string[]

    //readonly availabiltyZone: string[]

    //readonly awsaccountid: string;

    //readonly region: string;

}





export class LambdaStack extends Stack {

   




    constructor(scope: Construct, id: string, readonly props: LambdaProps) {

        super(scope, id, props);

       




        // Project vpc including only the pprivate subnets to be used

      /*  const projectVPC = ec2.Vpc.fromVpcAttributes(this, 'project-vpc', {

            vpcId: this.props.vpcID,

            availabilityZones: this.props.availabiltyZone,

            privateSubnetIds: this.props.vpcSubnets




        }); */

/*

        // lambda layer for the functions

        const frontEndLayer = new LayerVersion(this, 'front-end-layer', {

            code: lambda.Code.fromAsset('../lambda-code/artifacts'),

            compatibleRuntimes: [

                Runtime.NODEJS_14_X

            ]

        }); */




        // Frontend lambda function, first: lambdarole, 2nd Security group, 3rd the lambda integration function

        const projectRole = createLambdaRole(this, `eapdp-LambdaRole-${props.stageName}`)

/*

        const FrontEndSG = new SecurityGroup(this, 'FrontEndSecurityGroup', {

            // return new SecurityGroup(stack, sgName, {

            securityGroupName: 'FrontEndSecurityGroup',

            vpc: projectVPC,

            allowAllOutbound: true,

            description: "Security Group for Frontend function",

        })




        FrontEndSG.addIngressRule(ec2.Peer.ipv4(this.props.agilePLMCidrIP), ec2.Port.tcp(this.props.agilePLMEgressPort))




        for (let ipCdrBlock of this.props.listOfPrivateSubnetsCdrBlock) {

            FrontEndSG.addIngressRule(ec2.Peer.ipv4(ipCdrBlock), ec2.Port.allTcp())

        }

*/

        const FrontEndLambdaFunction = new Function(this, `eapdp_backend_lambda_${this.props.stageName}`, {

            functionName: `eapdp_backend_lambda_${this.props.stageName}`,

            code: lambda.Code.fromAsset('../lambda-code/dist'),





            role: projectRole,

            //layers: [frontEndLayer],

            //vpc: projectVPC,

            //securityGroups: [FrontEndSG],




            handler: 'src/api-entry-point.handler',

            memorySize: 512,

            timeout: Duration.seconds(30),

            runtime: Runtime.NODEJS_14_X

        });

       

        // ApiGateway

        const LambdaRestApi = new apigw.RestApi(this, `${this.props.stageName}-LambdaRestApi`, {

          restApiName: `${this.props.stageName}-Apigateway`,

          defaultCorsPreflightOptions: {

              allowOrigins: apigw.Cors.ALL_ORIGINS,

              allowMethods: apigw.Cors.ALL_METHODS,

          },

          endpointConfiguration: {

              types: [apigw.EndpointType.REGIONAL]

          },

          defaultMethodOptions: {

              authorizationType: apigw.AuthorizationType.NONE

          },

          deployOptions: {

              // 👇 update stage name to `dev`

              stageName: this.props.stageName

          }

      });




      const lambdaRestApiId = LambdaRestApi.restApiId;




      // frontend lambda function Resource policy for the api gateway




    //  FrontEndLambdaFunction.addPermission('apigatewaypermission-frontend1',{

      //    principal: new ServicePrincipal('apigateway.amazonaws.com'),

      //    sourceArn: `arn:aws:execute-api:${this.props.env?.region}:${this.props.env?.account}:${lambdaRestApiId}/*/*/*`

      //})

      //FrontEndLambdaFunction.addPermission('apigatewaypermission-frontend2',{

        //  principal: new ServicePrincipal('apigateway.amazonaws.com'),

          //sourceArn: `arn:aws:execute-api:${this.props.env?.region}:${this.props.env?.account}:${lambdaRestApiId}/*/*/*/*`

      //})





      let userpool




      //userpool = cognito.UserPool.fromUserPoolArn(this, 'test', 'arn:aws:cognito-idp:us-east-1:969829910614:userpool/us-east-1_A9yf2z0L1');

      userpool = cognito.UserPool.fromUserPoolArn(this, 'test', cdk.Fn.importValue(`${this.props.stageName}userPoolArn`));

      const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'booksAuthorizer', { cognitoUserPools: [userpool] });

     

      // Authorizer for the Hello World API that uses the

      // Cognito User pool to Authorize users.

     /* const authorizer = new apigw.CfnAuthorizer(this, `${this.props.stageName}-Lambda-CognitoAuthorizer`, {

          restApiId: LambdaRestApi.restApiId,

          name: `${this.props.stageName}-Lambda-CognitoAuthorizer`,

          type: 'COGNITO_USER_POOLS',

          identitySource: 'method.request.header.Authorization',

         // providerArns: ['arn:aws:cognito-idp:us-east-1:969829910614:userpool/us-east-1_bTycICgfP'],

          providerArns: [userpool.userPoolArn],

      })*/






      const frontendPermission = new LambdaIntegrationOnePermissionOnly(FrontEndLambdaFunction, {

          restApi: LambdaRestApi




      })




      const myMethodResponse: apigateway.MethodResponse = {

          statusCode: '401',




          // the properties below are optional

          responseModels: {

              'application/json': apigateway.Model.ERROR_MODEL

          },

          responseParameters: {

              'method.response.header.Access-Control-Allow-Origin': true

          },

      };




      // Resoure db

      const db = LambdaRestApi.root.addResource('db');




      //  Resource db/delete

      const dbDelete = db.addResource("delete");





      // /db/delete/additionalcriteria

      const dbDeleteAdditionalcriteria = dbDelete.addResource("dbdeleteadditionalcriteria");

      const dbDeleteAdditionalcriteriaMethod = dbDeleteAdditionalcriteria.addMethod('DELETE', new apigw.LambdaIntegration(FrontEndLambdaFunction), {

          authorizationType: apigw.AuthorizationType.COGNITO,

          authorizer: auth,

          methodResponses: [myMethodResponse]

      })

      frontendPermission.bind1(dbDeleteAdditionalcriteriaMethod)
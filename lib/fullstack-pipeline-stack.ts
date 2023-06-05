import * as cdk from 'aws-cdk-lib';

import { SecretValue, Environment } from 'aws-cdk-lib';

import { Construct } from 'constructs';

import { Artifacts, BuildEnvironmentVariableType, BuildSpec, ISource, LinuxBuildImage, PipelineProject, Project } from 'aws-cdk-lib/aws-codebuild';

//import { Artifact, IStage, Pipeline } from 'aws-cdk-lib/aws-codepipeline';

//import { CodePipeline } from "aws-cdk-lib/pipelines";

import { CloudFormationCreateUpdateStackAction, CodeBuildAction, CodeBuildActionType, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';

//import { ServiceStack } from "./service-stack";

//import * as yaml from 'yaml'; // https://www.npmjs.com/package/yaml

import * as path from "path";

import * as fs from "fs";

//import { BillingSTack } from './billing-stack';

import { type } from 'os';

import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';

import { Topic } from 'aws-cdk-lib/aws-sns';

import { EventField, RuleTargetInput } from 'aws-cdk-lib/aws-events';

import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

//import { IStage } from 'aws-cdk-lib/aws-apigateway';

import { Stack, StackProps } from "aws-cdk-lib";


import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep, StageDeployment } from 'aws-cdk-lib/pipelines';

//import { LambdaAppStage } from './stages/lamba-app-stage';

import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";




// import * as sqs from '@aws-cdk/aws-sqs';

//import { Construct } from '@aws-cdk/core';

import { InfraPipelineStage } from './stages/website-stage';

//https://github.com/findy-network/findy-agent-infra/blob/master/aws-ecs/lib/frontend.ts#L47




import {

  aws_codebuild as codebuild,

  aws_logs as logs,

  CfnOutput,

} from "aws-cdk-lib";

import { StringParameter } from "aws-cdk-lib/aws-ssm";

import { PolicyStatement } from "aws-cdk-lib/aws-iam";




import { GRPCPortNumber } from "./constants";

import { NotificationRule } from "aws-cdk-lib/aws-codestarnotifications";

import * as codecommit from 'aws-cdk-lib/aws-codecommit';

import { LambdaAppStage, LambdastageProps } from './stages/lamba-stage';

import { IRepository } from 'aws-cdk-lib/aws-ecr';




interface InfraPipelineProperties extends StackProps {

 // readonly DeploymentEnv: string

  readonly uiPackage: string

  readonly lambdaPackage: string

  //readonly availabiltyZone: string[]

 





 }




const environmentVariables: Record<string, codebuild.BuildEnvironmentVariable> =

{

  DOMAIN_NAME: {

    type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,

    value: "/findy-agency/domain-name",

  },

  SUB_DOMAIN_NAME: {

    type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,

    value: "/findy-agency/sub-domain-name",

  },

  API_SUB_DOMAIN_NAME: {

    type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,

    value: "/findy-agency/api-sub-domain-name",

  },

  GENESIS_TRANSACTIONS: {

    type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,

    value: "/findy-agency/genesis",

  },

  ADMIN_ID: {

    type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER,

    value: "FindyAgency:findy-agency-admin-id",

  },

  ADMIN_AUTHN_KEY: {

    type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER,

    value: "FindyAgency:findy-agency-admin-authn-key",

  },

};





export class fullStackPipeline extends Stack {

  readonly uatEnv: Environment

  readonly prodEnv: Environment

  readonly devEnv: Environment

 // readonly uiInput: CodePipelineSource

  //readonly lambdaInput: CodePipelineSource

  //readonly uirepo: cdk.aws_codecommit.IRepository;

  //readonly lambdarepo: cdk.aws_codecommit.IRepository;

 




  constructor(scope: Construct, id: string, props: InfraPipelineProperties) {

    super(scope, id, props);

   
  

    console.log(`uiPackage: ${props.uiPackage}`)

   // const deploymentEnv = props.DeploymentEnv
   //arn:aws:codestar-connections:us-east-1:673233218795:connection/0206d2f3-305c-40b4-a635-15ea69d05302
   

    //const stackrepo = codecommit.Repository.fromRepositoryName(this, 'cdk-source-code','cdk-code');

    //const infraInput = CodePipelineSource.codeCommit(stackrepo, 'master')
    
    
    const infraInput = CodePipelineSource.gitHub('kengne66/cdk-pipeline-for-fullstatck', 'main', {
      authentication: SecretValue.secretsManager('github-kengne'),
    })

   

   // const uirepo = codecommit.Repository.fromRepositoryName(this, 'uitesting', props.uiPackage); 
    //const lambdarepo = codecommit.Repository.fromRepositoryName(this, 'Lambda_code', props.lambdaPackage);

   
  //const uiInput = CodePipelineSource.codeCommit(uirepo, 'master')
  const uiInput = CodePipelineSource.gitHub(`kengne66/${props.uiPackage}`, 'master', {
    authentication: SecretValue.secretsManager('github-kengne'),
  })



    //const lambdaInput = CodePipelineSource.codeCommit(lambdarepo, 'main')
    const lambdaInput = CodePipelineSource.gitHub(`kengne66/${props.lambdaPackage}`, 'master', {
      authentication: SecretValue.secretsManager('github-kengne'),
    })

  



    const fullstackpipeline = new CodePipeline(this, 'fullstackPipeline', {

      pipelineName: 'fullstackPipeline',

      synth: new ShellStep('Synth', {

        input: infraInput,




        additionalInputs: {

          "../frontend-ui": uiInput,

          "../lambda-code": lambdaInput

     

        },




        installCommands: [

          'npm install -g aws-cdk'

      ],

        commands: ['npm ci', 'npm run build', 'npx cdk synth']

      }),




     

    });

 




   






    const BuildAngular = new InfraPipelineStage(this, "buildangularwebsite", {

      env: this.uatEnv

    });

    const BuildAngularStage = fullstackpipeline.addStage(BuildAngular);




    // Use custom step to update with custom healthy settings

    //




    BuildAngularStage.addPost(

      new CodeBuildStep('buildAngularWeb', {

       

        input: uiInput,

       




        installCommands: [

          'pwd',

          'npm install -g aws-cdk',

          'ls'

        ],

        commands: ['npm ci',

                   'npm run build',

                   'ls dist/websitePractise',

                   'rm -r artifacts && mkdir artifacts',

                   'rsync -a dist/websitePractise/ artifacts/',

                   'ls artifacts',

                   'aws s3 sync artifacts/. s3://angularwebsite.pierre.com'

                  ],

        buildEnvironment: {

          // The user of a Docker image asset in the pipeline requires turning on

          // 'dockerEnabledForSelfMutation'.

          buildImage: LinuxBuildImage.STANDARD_6_0

        },

        primaryOutputDirectory: 'dist/websitePractise',

       

     

      }

    ));  




    const BuildLambda = new LambdaAppStage(this, "buildlambdastage", {

      stageName: 'uat',

     // vpcID: props.vpcID,

      //vpcSubnets: props.vpcSubnets,

      //availabiltyZone: props.availabiltyZone

    });

    const BuildLambdaStage = fullstackpipeline.addStage(BuildLambda);  




    // Use custom step to update with custom healthy settings

 

/*

    BuildLambdaStage.addPost(

      new CodeBuildStep('buildLambda', {

       

        input: lambdaInput,

       




        installCommands: [

          'pwd',

          'npm install -g aws-cdk',

          'apt install zip',

          'ls'

        ],

        commands: [

          'npm ci',

          'npm run build',

          'ls dist',

          'rm -r artifacts && mkdir artifacts',

          'zip -r buildfunction.zip dist/',

          'cp buildfunction.zip artifacts/',

          'ls artifacts',

          'aws s3 sync artifacts/. s3://gl.envision-aesc.com'],

        buildEnvironment: {

          // The user of a Docker image asset in the pipeline requires turning on

          // 'dockerEnabledForSelfMutation'.

          buildImage: LinuxBuildImage.STANDARD_6_0

        },

        primaryOutputDirectory: 'dist',

       

     

      }

    )); 
  */

  /*

    const deploy1 = new InfraPipelineStage(this, "Deploy1", {

      env: props?.env,

    });

    const deployStage = fullstackpipeline.addStage(deploy1);

    */

 

  }

 




 

}







/*

export class PipelineCdkStack extends cdk.Stack {

  private readonly pipeline: Pipeline;

  private readonly cdkBuildOutput: Artifact;

  private readonly angularBuildOutput: Artifact;

  private readonly angularSourceOutput: Artifact;

  private readonly pipelineNotificationsTopic: Topic;




  constructor(scope: Construct, id: string, props?: cdk.StackProps) {

    super(scope, id, props);




    this.pipeline = new Pipeline(this, "angularCDKPipeline", {

      pipelineName: 'AngularCDKPipeline',

      crossAccountKeys: false,

      restartExecutionOnUpdate: true,

     

    });

   

    this.pipelineNotificationsTopic = new Topic(

      this, "angularCdkPipelineNotificationsTopic", {

        topicName: "angularCdkPipelineNotificationsTopic"

      }

    )




    this.pipelineNotificationsTopic.addSubscription(new EmailSubscription("pierre_kengne@yahoo.com"))




    const cdkSourceOutput = new Artifact('CDKForAngularsourceOutput');

    this.angularSourceOutput = new Artifact('angularSourceOutput');




    this.pipeline.addStage({

      stageName: 'Source',

      actions: [

        new GitHubSourceAction({

          owner: 'kengne66',

          repo: 'cdk-for-angular-website',

          branch: 'main',

          actionName: 'Pipeline_Source',

          oauthToken: SecretValue.secretsManager('github-token'),

          output:  cdkSourceOutput

        }),

        new GitHubSourceAction({

          owner: 'kengne66',

          repo: 'angular-website-example',

          branch: 'master',

          actionName: 'angular_Source',

          oauthToken: SecretValue.secretsManager('github-token'),

          output:  this.angularSourceOutput

        })

      ]

    });





    this.cdkBuildOutput = new Artifact('cdkForAngularBuildOutput')

    this.angularBuildOutput = new Artifact('angularBuildOutput')




    //const stringified = fs.readFileSync(path.join(__dirname, './buildspec.yml'), { encoding: 'utf-8', });

    //const parsed  = yaml.parse(stringified);




    //const specFile = (this.angularBuildOutput.atPath(`'build-specs/service-build-spec.yml'`)).fileName




    this.pipeline.addStage({

      stageName: "Build",

      actions: [

        new CodeBuildAction({

          actionName: 'CDK_Build',

          input:  cdkSourceOutput,

          outputs: [this.cdkBuildOutput],

          project: new PipelineProject(this, 'cdkBuildProject', {

            environment: {

              buildImage: LinuxBuildImage.STANDARD_5_0

            },

            buildSpec : BuildSpec.fromAsset(

              'build-specs/cdk-build-spec.yml'

            )

          })

        }),




        new CodeBuildAction({

          actionName: 'angular_Build',

          input:  this.angularSourceOutput,

          outputs: [this.angularBuildOutput],

          project: new PipelineProject(this, 'angularBuildProject', {

            environment: {

              buildImage: LinuxBuildImage.STANDARD_5_0

            },




          })

         

        })

      ]

    });




    this.pipeline.addStage( {

      stageName: "pipeline_Update",

      actions: [

        new CloudFormationCreateUpdateStackAction( {

          actionName: "Pipeline_Update",

          stackName: "angularCDKPipelineStack",

          templatePath: this.cdkBuildOutput.atPath("angularCDKPipelineStack.template.json"),

          adminPermissions: true

        }),

      ],

    });

 




  }

*/








  /*

  public addServiceStage(serviceStack: ServiceStack, stageName: string): IStage {

    return this.pipeline.addStage({

      stageName: stageName,

      actions: [

        new CloudFormationCreateUpdateStackAction({

          account: serviceStack.account,

          region: serviceStack.region,

          actionName: "Service_Update",

          stackName: serviceStack.stackName,

          templatePath: this.cdkBuildOutput.atPath(`${serviceStack.stackName}.template.json`),

          adminPermissions: true,

          parameterOverrides: {

            ...serviceStack.servicecode.assign(this.serviceBuildOutput.s3Location)

          },

          extraInputs: [this.serviceBuildOutput]

         

        })

      ]

    })

  };




  public addBillingStackToStage(billingStack: BillingSTack, stage: IStage) {

    stage.addAction(new CloudFormationCreateUpdateStackAction({

      actionName: "Billing_Update",

      stackName: billingStack.stackName,

      templatePath: this.cdkBuildOutput.atPath(`${billingStack.stackName}.template.json`),

      adminPermissions: true

    }))

  };

  // coment

  public addServiceIntegrationTestStage(

    stage:IStage,

    serviceEndpoint: string

  ) {

    const integTestAction = new CodeBuildAction({

      actionName: "Integration_Tests",

      input: this.serviceSourceOutput,

      project: new PipelineProject(this, "ServiceIntegrationTestProject", {

        environment: {

          buildImage: LinuxBuildImage.STANDARD_5_0,

        },

        buildSpec: BuildSpec.fromSourceFilename("buildspec-test.yml"),

      }),

      environmentVariables: {

        SERVICE_ENDPOINT: {

          value: serviceEndpoint,

          type: BuildEnvironmentVariableType.PLAINTEXT

        }

      },

      type: CodeBuildActionType.TEST,

      runOrder: 2

    });

    stage.addAction(integTestAction);

    integTestAction.onStateChange(

      "IntegrationTestFailed",

      new SnsTopic(this.pipelineNotificationsTopic, {

        message: RuleTargetInput.fromText(`Integration test failed, see results here: ${EventField.fromPath(

          '$.detail.execution-result.external-execution-url'

        )}`

        )

      }),

      {

        ruleName: "IntegrationTestFailed",

        eventPattern: {

          detail: {

            state: ["FAILED"]

          },

        },

        description: "Integration test that fails"

      }

    )  

  }

  */
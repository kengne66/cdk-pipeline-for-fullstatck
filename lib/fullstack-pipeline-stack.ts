import * as cdk from 'aws-cdk-lib';
import { SecretValue, Environment } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Artifacts, BuildEnvironmentVariableType, BuildSpec, LinuxBuildImage, PipelineProject, Project } from 'aws-cdk-lib/aws-codebuild';
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

import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
//import { LambdaAppStage } from './stages/lamba-app-stage';
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment"; 

// import * as sqs from '@aws-cdk/aws-sqs';
//import { Construct } from '@aws-cdk/core';
//https://github.com/findy-network/findy-agent-infra/blob/master/aws-ecs/lib/frontend.ts#L47

export class fullStackPipeline extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubAuth = cdk.SecretValue.secretsManager('github-token');

    const fullstackpipeline = new CodePipeline(this, 'fullstackPipeline', {
      pipelineName: 'fullstackPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('kengne66/cdk-pipeline-for-fullstatck', 'main', {
          authentication: githubAuth
        }),

        additionalInputs: {
          "../static-website": CodePipelineSource.gitHub('kengne66/angular-website-example', 'master', {
            authentication: githubAuth
          }),
      
        },

        installCommands: [
          'npm install -g aws-cdk'
      ],
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      }),

      
    });

    fullstackpipeline.addWave('MyWave', {
      post: [
        
        new CodeBuildStep('RunApproval', {
          /*
          input: CodePipelineSource.gitHub('kengne66/angular-website-example', 'master', {
            authentication: githubAuth
          }),
          */
          

          installCommands: [
            'ls',
            'cd ../static-website',
            'npm install -g aws-cdk'
        ],
          commands: ['npm ci', 'npm run build', 'ls'],
          buildEnvironment: {
            // The user of a Docker image asset in the pipeline requires turning on
            // 'dockerEnabledForSelfMutation'.
            buildImage: LinuxBuildImage.STANDARD_6_0
          },
          primaryOutputDirectory: 'dist/websitePractise',
          
        }),
      ],
    });






/*
    fullstackpipeline.addStage(new LambdaAppStage(this, "dev", {
      env: {account: '673233218795', region: 'us-east-1',}
    }))
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
  

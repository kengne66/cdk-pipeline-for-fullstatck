
import * as cdk from 'aws-cdk-lib';

import { Environment } from 'aws-cdk-lib';

import { Construct } from 'constructs'

import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';

import { CodeBuildStep, CodePipeline, CodePipelineSource, ManualApprovalStep, ShellStep } from 'aws-cdk-lib/pipelines';

import { aws_codebuild as codebuild, aws_logs as logs } from "aws-cdk-lib";

import * as codecommit from 'aws-cdk-lib/aws-codecommit';

import { deploymentstage } from './stages/deployment-stage';
import { IStage } from 'aws-cdk-lib/aws-apigateway';




interface InfraPipelineProperties extends cdk.StackProps {

  ///readonly DeploymentEnv: Environment

  readonly uiPackage: string

  readonly uiBranch: string

  readonly lambdaPackage: string

  readonly lambdaBranch: string

  readonly vpcID: string;

  readonly deploymentRegion: string;

  readonly deploymentAccount: string;

  readonly deploymentStage: string;

 

  domainName: string;

  readonly devDomainName: string;

  readonly qaDomainName: string;

  readonly uatDomainName: string;
  readonly prodDomainName: string;




  readonly devVpcPrivateSubnets: string[]

  readonly qaVpcPrivateSubnets: string[]

  readonly uatVpcPrivateSubnets: string[]

  readonly prodVpcPrivateSubnets: string[]




  readonly devAvailabiltyZones: string[]

  readonly qaAvailabiltyZones: string[]

  readonly uatAvailabiltyZones: string[]

  readonly prodAvailabiltyZones: string[]




  readonly devListOfPrivateSubnetsCidrBlock: string[]

  readonly qaListOfPrivateSubnetsCidrBlock: string[]

  readonly uatListOfPrivateSubnetsCidrBlock: string[]

  readonly prodListOfPrivateSubnetsCidrBlock: string[]

 }





export class fullStackPipeline extends cdk.Stack {

  readonly uatEnv: Environment

  readonly prodEnv: Environment

  readonly devEnv: Environment
 
 




  constructor(scope: Construct, id: string, props: InfraPipelineProperties) {

    super(scope, id, props);

   

    console.log(`uiPackage: ${props.uiPackage}`)

   // const deploymentEnv = props.DeploymentEnv

   

    const stackrepo = codecommit.Repository.fromRepositoryName(this, 'cdk-source-code','cdk-code');

    const infraInput = CodePipelineSource.codeCommit(stackrepo, 'master')

   

    const uirepo = codecommit.Repository.fromRepositoryName(this, 'uitesting', props.uiPackage);

    //const uirepoprod = codecommit.Repository.fromRepositoryName(this, 'uitesting', props.prodUiPackage);

    //const uirepodev = codecommit.Repository.fromRepositoryName(this, 'uitesting', props.devUiPackage);




   

   

    const lambdarepo = codecommit.Repository.fromRepositoryName(this, 'Lambda_code', props.lambdaPackage);

    //const lambdarepouat = codecommit.Repository.fromRepositoryName(this, 'Lambda_code', props.uatLambdaPackage);

    //const lambdarepodev = codecommit.Repository.fromRepositoryName(this, 'Lambda_code', props.devLambdaPackage);

   

    const lambdaInput = CodePipelineSource.codeCommit(lambdarepo, props.lambdaBranch)

    const uiInput = CodePipelineSource.codeCommit(uirepo, props.uiBranch)






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

   

    if ( props.deploymentStage == "dev" ) {
      const deployStagedev = new deploymentstage(this, `${props.deploymentStage}-deploy`, {

        stage: "dev",
  
        vpcID: props.vpcID,
  
        vpcPrivateSubnets: props.devVpcPrivateSubnets,
  
        availabiltyZones: props.devAvailabiltyZones,
  
        listOfPrivateSubnetsCidrBlock: props.devListOfPrivateSubnetsCidrBlock,
  
        deploymentAccount: props.deploymentAccount,
  
        deploymentRegion: props.deploymentRegion,
  
        domainName: props.devDomainName
  
      });

      const devdeployStage = fullstackpipeline.addStage(deployStagedev)  

      devdeployStage.addPost(
        createAgularStep("dev", props.devDomainName),

        createUilambdaStep("dev"),

        createLayerlambdaStep("dev"),

        createSchedulerStep("dev"),

        createEmailStep("dev")
      )

    } else  {
      const deployStageqa = new deploymentstage(this, `qa-deploy`, {

        stage: "qa",
  
        vpcID: props.vpcID,
  
        vpcPrivateSubnets: props.qaVpcPrivateSubnets,
  
        availabiltyZones: props.qaAvailabiltyZones,
  
        listOfPrivateSubnetsCidrBlock: props.qaListOfPrivateSubnetsCidrBlock,
  
        deploymentAccount: props.deploymentAccount,
  
        deploymentRegion: props.deploymentRegion,
  
        domainName: props.qaDomainName
      })

      const qadeployStage = fullstackpipeline.addStage(deployStageqa)  

      qadeployStage.addPost(
        createAgularStep("qa", props.qaDomainName),

        createUilambdaStep("qa"),

        createLayerlambdaStep("qa"),

        createSchedulerStep("qa"),

        createEmailStep("qa")
      )
      

    };

    if ( props.deploymentStage == "uat" || props.deploymentStage == "prod" ) {
      const deployStageuat = new deploymentstage(this, `${props.deploymentStage}-deploy`, {

        stage: "uat",
  
        vpcID: props.vpcID,
  
        vpcPrivateSubnets: props.uatVpcPrivateSubnets,
  
        availabiltyZones: props.uatAvailabiltyZones,
  
        listOfPrivateSubnetsCidrBlock: props.uatListOfPrivateSubnetsCidrBlock,
  
        deploymentAccount: props.deploymentAccount,
  
        deploymentRegion: props.deploymentRegion,
  
        domainName: props.uatDomainName
  
      });

      const uatdeployStage = fullstackpipeline.addStage(deployStageuat)  

      uatdeployStage.addPost(
        createAgularStep("uat", props.uatDomainName),

        createUilambdaStep("uat"),

        createLayerlambdaStep("uat"),

        createSchedulerStep("uat"),

        createEmailStep("uat")
      )

      if ( props.deploymentStage == "prod" ) {




        const deployStageprod = new deploymentstage(this, `${props.deploymentStage}-deploy`, {
  
          stage: "prod",
    
          vpcID: props.vpcID,
    
          vpcPrivateSubnets: props.prodVpcPrivateSubnets,
    
          availabiltyZones: props.prodAvailabiltyZones,
    
          listOfPrivateSubnetsCidrBlock: props.prodListOfPrivateSubnetsCidrBlock,
    
          deploymentAccount: props.deploymentAccount,
    
          deploymentRegion: props.deploymentRegion,
    
          domainName: props.prodDomainName
    
        });

        const deployStage = fullstackpipeline.addStage(deployStageprod)

        deployStage.addPre(
          new ManualApprovalStep("Promote to Prod")
        )
        
        deployStage.addPost(
          createAgularStep("prod", props.prodDomainName),
  
          createUilambdaStep("prod"),
  
          createLayerlambdaStep("prod"),
  
          createSchedulerStep("prod"),
  
          createEmailStep("prod")
        )

  
      } 

    } 


    

    function createAgularStep(deploymentEnv: String, evnDomainName: String) {
      return new CodeBuildStep(`${deploymentEnv}-buildAngularWeb`, {
        
        input: uiInput,
        
        installCommands: [
          'pwd',
          'npm install -g aws-cdk',
        ],

        commands: [
          'npm ci',
          'npm run build',
          'ls dist/eapdp-ui',
          'rm -r artifacts && mkdir artifacts',
          'rsync -a dist/eapdp-ui/ artifacts/',
          'ls artifacts',
          `aws s3 sync artifacts/. s3://${deploymentEnv}-${evnDomainName}`
        ],

        buildEnvironment: {

          buildImage: LinuxBuildImage.STANDARD_6_0

        },

        primaryOutputDirectory: 'dist/eapdp-ui',

      })
    }


    function createUilambdaStep(deploymentEnv: String) {
      return new CodeBuildStep(`${deploymentEnv}-buildUiLambda`, {
        
        input: lambdaInput,
        
        installCommands: [

          'npm install -g aws-cdk',

        ],

        commands: [
          'cd eapdp-api',

          'npm ci',

          'npm run build',

          'ls dist',
        ],

        primaryOutputDirectory: 'eapdp-api/dist',

      })
    }

    function createLayerlambdaStep(deploymentEnv: String) {
      return new CodeBuildStep(`${deploymentEnv}-buildLambdaLayer`, {
        
        input: lambdaInput,
        
        installCommands: [

          'npm install -g aws-cdk',

        ],

        commands: [
          'cd eapdp-layer',

          'npm ci',

          'rm -r artifacts && mkdir artifacts',

          'cp -R node_modules/* artifacts/',

          'ls artifacts',

        ],

        primaryOutputDirectory: 'eapdp-layer/artifacts',

      })
    }

    function createSchedulerStep(deploymentEnv: String) {
      return new CodeBuildStep(`${deploymentEnv}-LambdaScheduler`, {
        
        input: lambdaInput,
        
        installCommands: [

          'npm install -g aws-cdk',

        ],

        commands: [
          'cd eapdp-scheduler',

          'npm ci',

          'npm run build',

          'ls dist',
        ],

        primaryOutputDirectory:  'eapdp-scheduler/dist',

      })
    }


    function createEmailStep(deploymentEnv: String) {
      return new CodeBuildStep(`${deploymentEnv}-LambdaEmail`, {
        
        input: lambdaInput,
        
        installCommands: [

          'npm install -g aws-cdk',

        ],

        commands: [
          'cd eapdp-email',

          'npm ci',

          'npm run build',

          'ls dist',

        ],

        primaryOutputDirectory:  'eapdp-email/dist',

      })
    }

 
  }  

}



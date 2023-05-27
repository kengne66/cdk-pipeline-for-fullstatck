import { Stack, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from 'constructs';
import { FrontendStack } from "../frontend";

export interface WebsiteStageProps extends StageProps {
  domainName: string;
  //hostedZoneName: string;
  //hostedZoneId: string;
}

export class WebsiteStage extends Stage {
  readonly frontEndStack: Stack
  constructor(scope: Construct, id: string, props: WebsiteStageProps) {
    super(scope, id, props);

   //this.frontEndStack =  new FrontendStack(this, "FrontendStack", props);
    
  }
}
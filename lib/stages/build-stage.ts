
import { Stage, StageProps, CfnOutput, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";


export class buildStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    new Stack(this, "buildStack", props)
  }
}
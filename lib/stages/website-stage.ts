
import { Stage, StageProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { InfraStack } from "../infra-stack";

export class InfraPipelineStage extends Stage {
  public readonly clusterName: CfnOutput;
  public readonly serviceArn: CfnOutput;
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    //const infra = new InfraStack(this, "fullstackPipeline", props);

    new InfraStack (this, `${id}Frontend`)

  }
}
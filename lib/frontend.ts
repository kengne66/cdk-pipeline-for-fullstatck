import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from 'constructs';
import { Bucket, BlockPublicAccess, IBucket } from "aws-cdk-lib/aws-s3";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager";
import * as Route53 from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

export interface FrontendStackProps extends StackProps {
  domainName: string;
  //hostedZoneName: string;
  //hostedZoneId: string;
}

export class FrontendStack extends Stack {
  readonly frontEndBucket: IBucket
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    this.frontEndBucket = new Bucket(this, "FrontendBucket", {
      bucketName: props.domainName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    new CfnOutput(this, 'websitebucket', { value: this.frontEndBucket.bucketArn });
    /*
    const zone = Route53.PublicHostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.hostedZoneName,
      }
    );

    const certificate = new DnsValidatedCertificate(this, "FrontendCert", {
      domainName: props.domainName,
      region: "us-east-1",
      hostedZone: zone,
    });
    */

    const distribution = new Distribution(this, "FrontendDistribution", {
      defaultBehavior: {
        origin: new S3Origin(this.frontEndBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      //domainNames: [props.domainName],
      //certificate: certificate,
      defaultRootObject: "index.html",
    });
/*
    new Route53.ARecord(this, "AliasRecord", {
      zone,
      recordName: props.domainName,
      target: Route53.RecordTarget.fromAlias(
        new CloudFrontTarget(distribution)
      ),
    });
*/
  }
}
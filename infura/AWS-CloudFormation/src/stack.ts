/* eslint-disable @typescript-eslint/consistent-type-imports */
import * as cdk from "aws-cdk-lib";
import { CloudFrontWebDistribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class AwsS3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //storage
    const bucket = new s3.Bucket(this, "Golf-District-Bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.POST, s3.HttpMethods.PUT],
          exposedHeaders: ["ETag"],
        },
      ],
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("lambda.amazonaws.com")],
        actions: ["s3:GetObject"],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    bucket.policy?.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("lambda.amazonaws.com")],
        actions: ["s3:GetBucketTagging"],
        resources: [bucket.bucketArn],
      })
    );

    // Cloudfront
    const distribution = new CloudFrontWebDistribution(this, "golf-district-distribution", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: new OriginAccessIdentity(this, "golf-district-identity", {
              comment: "golf-district-identity",
            }),
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    //GeoCode
    const placeIndex = new cdk.aws_location.CfnPlaceIndex(this, "golf-district-place-index", {
      dataSource: "Esri",
      indexName: "Gold-District-GeoCode-Index",
    });

    const GoldDistrictApplication = new iam.User(this, "GoldDistrictApplication");

    const locationPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["geo:SearchPlaceIndexForText"],
      resources: [placeIndex.attrIndexArn],
    });

    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
      resources: [`${bucket.bucketArn}/*`],
    });

    GoldDistrictApplication.addToPolicy(locationPolicy);
    GoldDistrictApplication.addToPolicy(s3Policy);

    const accessKey = new iam.CfnAccessKey(this, "GoldDistrictApplicationAccessKey", {
      userName: GoldDistrictApplication.userName,
    });

    new cdk.CfnOutput(this, "golf-district-Distribution", {
      value: distribution.distributionDomainName,
    });

    //comment these two lines out in order to not show the access key and secret access key in the terminal
    new cdk.CfnOutput(this, "@golf-district-platform/AccessKeyId", {
      value: accessKey.ref,
    });
    new cdk.CfnOutput(this, "@golf-district-platform/SecretAccessKey", {
      value: accessKey.attrSecretAccessKey,
    });
  }
}

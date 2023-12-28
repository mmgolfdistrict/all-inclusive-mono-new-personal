import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import yargs from "yargs";
import { AwsS3Stack } from "./stack";

// const argv = yargs
//   .option("stackId", {
//     alias: "s",
//     description: "The ID for the AWS stack",
//     type: "string",
//   })
//   .demandOption(["stackId"], "Please provide your desired stack ID")
//   .help()
//   .alias("help", "h").argv;

const app = new cdk.App();
new AwsS3Stack(app, "golf-district-aws-cloudformation", {});

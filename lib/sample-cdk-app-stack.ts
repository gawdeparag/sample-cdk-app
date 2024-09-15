import * as cdk from 'aws-cdk-lib';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Networking } from './networking';
import { DocumentManagementAPI } from './api';
import path from 'path';
import { DocumentManagementWebserver } from './webserver';

export class SampleCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'DocumentsBucket', {
      encryption: BucketEncryption.S3_MANAGED
    });

    new cdk.aws_s3_deployment.BucketDeployment(this, 'DocumentsDeployment', {
      sources: [cdk.aws_s3_deployment.Source.asset(path.join(__dirname, '..', 'documents'))],
      destinationBucket: bucket,
      memoryLimit: 512
    })

    new cdk.CfnOutput(this, 'DocumentsBucketNameExport', {
      value: bucket.bucketName,
      exportName: 'DocumentsBucketName'
    });

    const networkingStack = new Networking(this, 'NetworkingConstruct', {
      maxAzs: 2
    });

    cdk.Tags.of(networkingStack).add('Module', 'Networking');

    const api = new DocumentManagementAPI(this, 'DocumentManagementAPI', {
      documentsBucket: bucket
    });

    cdk.Tags.of(api).add('Module', 'API');
    
    const webserver = new DocumentManagementWebserver(this, 'DocumentManagementWebserver', {
      vpc: networkingStack.vpc,
      api: api.httpApi
    });

    cdk.Tags.of(webserver).add('Module', 'Webserver');
    
  }
}

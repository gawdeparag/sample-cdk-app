#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SampleCdkAppStack } from '../lib/sample-cdk-app-stack';

const app = new cdk.App();
const stack = new SampleCdkAppStack(app, 'SampleCdkAppStack');
cdk.Tags.of(stack).add('App', 'DocumentManagement');
cdk.Tags.of(stack).add('Environment', 'Development');
cdk.Tags.of(stack).add('Module', 'Networking');


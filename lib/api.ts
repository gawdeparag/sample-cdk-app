import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import path from 'path';
import * as apig from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';

interface DocumentManagementAPIProps {
    documentsBucket: cdk.aws_s3.IBucket
}

export class DocumentManagementAPI extends Construct {

    public readonly httpApi: apig.HttpApi;

    constructor(scope: Construct, id: string, props: DocumentManagementAPIProps) {
        super(scope, id);

        const getDocumentsFunction = new nodejs.NodejsFunction(this, 'GetDocumentsFunction', {
            runtime: Runtime.NODEJS_18_X,
            entry: path.join(__dirname, '..', 'api', 'getDocuments', 'index.ts'),
            handler: 'getDocuments',
            bundling: {
                externalModules: ['aws-sdk'],
            }, 
            environment: {
                DOCUMENTS_BUCKET_NAME: props.documentsBucket.bucketName
            }
        })

        const bucketPermissions = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW
        });
        bucketPermissions.addResources(`${props.documentsBucket.bucketArn}/*`);
        bucketPermissions.addActions('s3:GetObject', 's3:PutObject');
        getDocumentsFunction.addToRolePolicy(bucketPermissions);

        const bucketContainerPermissions = new iam.PolicyStatement();
        bucketContainerPermissions.addResources(`${props.documentsBucket.bucketArn}`);
        bucketContainerPermissions.addActions('s3:GetObject', 's3:ListBucket');
        getDocumentsFunction.addToRolePolicy(bucketContainerPermissions);

        this.httpApi = new apig.HttpApi(this, 'HttpAPI', {
            apiName: 'document-management-api',
            createDefaultStage: true,
            corsPreflight: {
                allowMethods: [ apig.CorsHttpMethod.GET ],
                allowOrigins: [ '*' ],
                maxAge: cdk.Duration.days(10)
            }
        });

        const integration = new apigIntegrations.HttpLambdaIntegration('GetDocumentsIntegration', getDocumentsFunction);
        
        this.httpApi.addRoutes({
            path: '/getDocuments',
            methods: [apig.HttpMethod.GET],
            integration: integration
        });

        new cdk.CfnOutput(this, 'HttpApiUrl', {
            value: this.httpApi.url!,
            exportName: 'HttpApiUrl'
        });

    }
}
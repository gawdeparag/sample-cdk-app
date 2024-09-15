import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: 'us-east-1' });
const bucketName = process.env.DOCUMENTS_BUCKET_NAME;
export const getDocuments = async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
    console.log(`Bucket Name: ${bucketName}`);

    try {
        const command = new ListObjectsV2Command({ Bucket: process.env.DOCUMENTS_BUCKET_NAME! });
        const { Contents: results } = await s3Client.send(command);
        console.log(results);
        const documents = await Promise.all(results!.map(async (result: any) => generateSignedURL(result.Key, result.ETag)));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ documents })
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error })
        }
    }
}
async function generateSignedURL(bucketName: any, objectKey: any): Promise<{fileName: string, url: string}> {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    // console.log("SIGNED URL: ", signedUrl);
    return {
        fileName: objectKey,
        url: signedUrl
    };
}


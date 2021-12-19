import {APIGatewayProxyEvent, Context, APIGatewayProxyResult} from "aws-lambda";

const AWS = require("aws-sdk");

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const anyNull = (arr: any[]) => arr.some(x => x === undefined || x === null);

    const bucket = process.env.bucket;
    const id = event.pathParameters?.ID;

    if (anyNull([bucket, id])) {
        return {
            statusCode: 400,
            body: "Environment is undefined."
        }
    }

    const s3Client = new AWS.S3({signatureVersion: "v4"});

    const s3Location = {Bucket: bucket, Key: id};
    try {
        //@ts-ignore
        await s3Client.headObject(s3Location).promise();
    } catch (e) {
        return {
            statusCode: 400,
            body: `Song '${id}' do not exist.`
        }
    }

    const signedUrl = s3Client.getSignedUrl("getObject", {
        Bucket: bucket,
        Key: id,
        Expires: 600});

    return {
        statusCode: 200,
        body: signedUrl
    }
}
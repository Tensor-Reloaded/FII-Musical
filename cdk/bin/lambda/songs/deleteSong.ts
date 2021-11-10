import {APIGatewayProxyEvent, Context, APIGatewayProxyResult} from "aws-lambda";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

const AWS = require("aws-sdk");

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const anyNull = (arr: any[]) => arr.some(x => x === undefined || x === null);

    const db = process.env.DB;
    const bucket = process.env.bucket;
    const id = event.pathParameters?.ID;

    if (anyNull([db, bucket, id])) {
        return {
            statusCode: 400,
            body: "Environment is undefined."
        }
    }

    const dbClient: DocumentClient = new AWS.DynamoDB.DocumentClient();
    const s3Client = new AWS.S3();

    const deleteDBRequest = {
        Key: {
            ID: id,
            ENTRY: "SONG"
        },
        TableName: db
    };

    try {
        // @ts-ignore
        await dbClient.delete(deleteDBRequest).promise();
    } catch (e) {
        return {
            statusCode: 400,
            body: "Fail to delete."
        }
    }

    const deleteS3ObjectRequest = {Bucket: bucket, Key: id};

    // @ts-ignore
    await s3Client.deleteObject(deleteS3ObjectRequest).promise();

    return {
        statusCode: 200,
        body: ""
    }
}
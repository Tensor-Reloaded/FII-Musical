import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
const AWS = require("aws-sdk");

export async function handler (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const anyNull = (arr: any[]) => arr.some(x => x === undefined || x === null);

    const db = process.env.DB;
    const bucket = process.env.bucket;

    if (anyNull([db, bucket])) {
        return {
            statusCode: 500,
            body: "Environment is undefined."
        }
    }

    if (event.body == null) {
        return {
            statusCode: 400,
            body: "Body Request is null."
        }
    }
    const jsonBody = JSON.parse(event.body);

    const ID = event.requestContext.requestId;
    let requestDB = {
        Item: {
            ID: ID,
            ENTRY: "SEED"
        },
        TableName: db,
        ConditionExpression: "attribute_not_exists(ID) and attribute_not_exists(alias)"
    };

    const requiredFields = ['alias', 'type']
    for (const field of requiredFields) {
        if (jsonBody[field] === null || jsonBody[field] === undefined) {
            return {
                statusCode: 400,
                body: `Field '${field}' is required.`
            }
        }
        // @ts-ignore
        requestDB.Item[field] = jsonBody[field]
    }
    // @ts-ignore
    requestDB.Item.genre = jsonBody.genre;

    const s3Client = new AWS.S3();
    const dbClient:DocumentClient  = new AWS.DynamoDB.DocumentClient();

    try {
        // @ts-ignore
        await dbClient.put(requestDB).promise();
    } catch(err) {
        return {
            statusCode: 400,
            body: JSON.stringify(err)
        }
    }

    const signedUrl = s3Client.getSignedUrl("putObject", {
        Bucket: bucket,
        Key: ID,
        Expires: 600});

    return {
        statusCode: 200,
        body: JSON.stringify({
            ID: ID,
            URL: signedUrl
        })
    }
}
import {APIGatewayProxyEvent, Context, APIGatewayProxyResult} from "aws-lambda";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import QueryInput = DocumentClient.QueryInput;

const AWS = require("aws-sdk");

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const anyNull = (arr: any[]) => arr.some(x => x === undefined || x === null);

    const db = process.env.DB;
    const seedBucket = process.env.seedBucket;
    const songBucket = process.env.songBucket;
    const modelId = event.pathParameters?.ID;


    if (db == null || anyNull([db, seedBucket, songBucket, modelId])) {
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
    const seedId = jsonBody.seed;

    const dbClient:DocumentClient = new AWS.DynamoDB.DocumentClient();
    const request: QueryInput = {
        TableName: db,
        KeyConditionExpression: 'ID = :id',
        FilterExpression: 'ENTRY = :e',
        ExpressionAttributeValues: {
            ':id': modelId,
            ':e': "MODEL"
        }
    }
    let model, seed;
    try {
        model = await dbClient.query(request).promise();
    } catch (err) {
        return {
            statusCode: 400,
            body: "Failed to retrieve the model"
        }
    }

    request.ExpressionAttributeValues = {
        ':id': seedId,
        ':e': "SEED"
    }

    try {
        seed = await dbClient.query(request).promise();
    } catch (err) {
        return {
            statusCode: 400,
            body: "Failed to retrieve the seed"
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            seed: seed,
            model: model
        })
    }
}
import {APIGatewayProxyEvent, Context, APIGatewayProxyResult} from "aws-lambda";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

const AWS = require("aws-sdk");

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

    const db = process.env.DB;

    if (db === null || db === undefined) {
        return {
            statusCode: 400,
            body: "Environment is undefined."
        }
    }

    let exclusiveStartKey = undefined
    if (event.body != null) {
        const jsonBody = JSON.parse(event.body);
        exclusiveStartKey = jsonBody?.ExclusiveStartKey
    }

    const scanDBRequest = {
        TableName: db,
        Limit: 100,
        ExclusiveStartKey: exclusiveStartKey,
        FilterExpression: "ENTRY = :e",
        ExpressionAttributeValues: {
            ":e": "MODEL"
        }
    };

    const dbClient: DocumentClient = new AWS.DynamoDB.DocumentClient();

    try {
        const scanResult = await dbClient.scan(scanDBRequest).promise();
        return {
            body: JSON.stringify({
                Items: scanResult.Items,
                LastEvaluatedKey: scanResult.LastEvaluatedKey
            }),
            statusCode: 200

        }
    } catch (e) {
        return {
            statusCode: 500,
            body: "Fail to scan the data base."
        }
    }
}
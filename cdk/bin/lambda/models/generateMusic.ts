import {APIGatewayProxyEvent, Context, APIGatewayProxyResult} from "aws-lambda";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import QueryInput = DocumentClient.QueryInput;
import {CreateProcessingJobRequest} from "aws-sdk/clients/sagemaker";

const AWS = require("aws-sdk");

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const anyNull = (arr: any[]) => arr.some(x => x === undefined || x === null);

  const db = process.env.DB;
  const seedBucket = process.env.seedBucket;
  const songBucket = process.env.songBucket;
  const modelBucket = process.env.modelBucket;
  const roleArn = process.env.roleArn;

  const modelId = event.pathParameters?.ID;

  if (db == null || roleArn == null || anyNull([db, seedBucket, songBucket, modelBucket, modelId, roleArn])) {
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

  const dbClient: DocumentClient = new AWS.DynamoDB.DocumentClient();
  const request: QueryInput = {
    TableName: db,
    KeyConditionExpression: 'ID = :id and ENTRY = :e',
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
      body: "Failed to retrieve the model. Error:" + err
    }
  }

  if (model.Items === undefined || model.Items.length == 0) {
    return {
      statusCode: 400,
      body: "Invalid model ID."
    }
  }

  model = model.Items[0]

  request.ExpressionAttributeValues = {
    ':id': seedId,
    ':e': "SEED"
  }

  try {
    seed = await dbClient.query(request).promise();
  } catch (err) {
    return {
      statusCode: 400,
      body: "Failed to retrieve the seed. Error:" + err
    }
  }

  if (seed.Items === undefined || seed.Items.length == 0) {
    return {
      statusCode: 400,
      body: "Invalid seed ID."
    }
  }

  seed = seed.Items[0]

  if (seed?.type != model?.type) {
    return {
      statusCode: 400,
      body: `Invalid seed type ${seed?.type} for a model with type ${model?.type}`
    }
  }

  const requestId = event.requestContext.requestId;

  const sagemaker = new AWS.SageMaker();
  const req: CreateProcessingJobRequest = {
    AppSpecification: {
      ImageUri: model.image,
      ContainerEntrypoint: ["python3", "./entrypoint.py"],
      ContainerArguments: ["process", "processor"]
    },
    ProcessingJobName: requestId,
    ProcessingResources: {
      ClusterConfig: {
        InstanceCount: 1,
        VolumeSizeInGB: 1,
        InstanceType: "ml.m4.xlarge"
      }
    },
    RoleArn: roleArn,
    Environment: {
      OutputFile: requestId
    },
    ProcessingInputs: [
      {
        InputName: "data",
        S3Input: {
          S3DataType: "S3Prefix",
          S3Uri: `s3://${seedBucket}/${seedId}`,
          LocalPath: "/opt/ml/processing/input/data/",
          S3InputMode: "File",
          S3DataDistributionType: "FullyReplicated"
        }
      },
      {
        InputName: "model",
        S3Input: {
          S3DataType: "S3Prefix",
          S3Uri: `s3://${modelBucket}/${modelId}/`,
          LocalPath: "/opt/ml/processing/input/model/",
          S3InputMode: "File",
          S3DataDistributionType: "FullyReplicated"
        }
      }
    ],
    ProcessingOutputConfig: {
      Outputs: [
        {
          OutputName: "output",
          S3Output: {
            S3UploadMode: "EndOfJob",
            S3Uri: `s3://${songBucket}/`,
            LocalPath: "/opt/ml/processing/output"
          }
        }
      ]
    }
  }

  try {
    await sagemaker.createProcessingJob(req).promise();
  } catch (err) {
    return {
      statusCode: 400,
      body: "Failed to create the processing Job. Error:" + err
    }
  }

  let requestDB = {
    Item: {
      ID: requestId,
      ENTRY: "SONG",
      modelId: modelId,
      seedId: seedId
    },
    TableName: db,
    ConditionExpression: "attribute_not_exists(ID)"
  };

  try {
    await dbClient.put(requestDB).promise();
  } catch(err) {
    return {
      statusCode: 400,
      body: `Failed to add the song entry in the data base. Error: ${err}`
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ID: requestId
    })
  }
}
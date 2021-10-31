import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";

export class ApiStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const seedBucket = new s3.Bucket(this, "SeedBucket")

        const songBucket = new s3.Bucket(this, "SongBucket")

        const tableDB = new dynamodb.Table(this, 'DB', {
            partitionKey: { name: 'ID', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'ENTRY', type: dynamodb.AttributeType.STRING }
        });

        const roleAPI = new iam.Role(this, 'RoleAPI', {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal("lambda.amazonaws.com"),
                new iam.ServicePrincipal("apigateway.amazonaws.com")),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
            ]
        });

        const api = new apigateway.RestApi(this,'API');
        api.root.addMethod('ANY')

        const seeds = api.root.addResource('seeds');
        // list all seeds with pagination
        seeds.addMethod("GET");
        // create new seed
        seeds.addMethod("POST",
            // new apigateway.LambdaIntegration()
        );
        const seedItem = seeds.addResource("{ID}");
        // download a specific seed
        seedItem.addMethod("GET");
        // delete a seed
        seedItem.addMethod("DELETE");

        // list all models
        const models = api.root.addResource('models');
        models.addMethod("GET");
        const modelItem = models.addResource("{ID}");
        // generate music
        modelItem.addMethod("POST");

        const songs = api.root.addResource('songs');
        // list all songs with pagination
        songs.addMethod("GET");
        const songItem = songs.addResource("{ID}");
        // download a specific song
        songItem.addMethod("GET");
        // share song
        songItem.addMethod("PUT");

    }
}
import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";

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
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")
            ]
        });

        const createSeedLambda = new lambda.Function(this, 'createSeed', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/seeds"),
            handler: "createSeed.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                DB: tableDB.tableName,
                bucket: seedBucket.bucketName
            }
        });

        const listSeedsFunction = new lambda.Function(this, 'listSeeds', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/seeds"),
            handler: "listSeeds.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                DB: tableDB.tableName,
            }
        })

        const deleteSeedFunction = new lambda.Function(this, 'deleteSeed', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/seeds"),
            handler: "deleteSeed.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                DB: tableDB.tableName,
                bucket: seedBucket.bucketName
            }
        });

        const downloadSeedFunction = new lambda.Function(this, 'downloadSeed', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/seeds"),
            handler: "downloadSeed.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: { bucket: seedBucket.bucketName}
        });

        const listSongsFunction = new lambda.Function(this, 'listSongs', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/songs"),
            handler: "listSongs.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                DB: tableDB.tableName,
            }
        })

        const downloadSongFunction = new lambda.Function(this, 'downloadSong', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/songs"),
            handler: "downloadSong.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: { bucket: songBucket.bucketName}
        })

        const deleteSongFunction = new lambda.Function(this, 'deleteSong', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/songs"),
            handler: "deleteSong.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                DB: tableDB.tableName,
                bucket: songBucket.bucketName
            }
        })

        const listModelsFunction = new lambda.Function(this, 'listModels', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/models"),
            handler: "listModels.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                DB: tableDB.tableName,
            }
        })

        const generateMusicFunction = new lambda.Function(this, 'generateMusic', {
            role: roleAPI,
            code: lambda.Code.fromAsset("./bin/lambda/models"),
            handler: "generateMusic.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                DB: tableDB.tableName,
                seedBucket: seedBucket.bucketName,
                songBucket: songBucket.bucketName
            }
        })

        const api = new apigateway.RestApi(this,'API');

        const seeds = api.root.addResource('seeds');
        // list all seeds with pagination
        seeds.addMethod("GET",
            new apigateway.LambdaIntegration(listSeedsFunction));
        // create new seed
        seeds.addMethod("POST",
            new apigateway.LambdaIntegration(createSeedLambda));

        const seedItem = seeds.addResource("{ID}");
        // download a specific seed
        seedItem.addMethod("GET",
            new apigateway.LambdaIntegration(downloadSeedFunction));
        // delete a seed
        seedItem.addMethod("DELETE",
            new apigateway.LambdaIntegration(deleteSeedFunction));

        const models = api.root.addResource('models');
        // list all models
        models.addMethod("GET",
            new apigateway.LambdaIntegration(listModelsFunction));

        const modelItem = models.addResource("{ID}");
        // generate music
        modelItem.addMethod("POST",
            new apigateway.LambdaIntegration(generateMusicFunction));

        const songs = api.root.addResource('songs');
        // list all songs with pagination
        songs.addMethod("GET",
            new apigateway.LambdaIntegration(listSongsFunction));
        const songItem = songs.addResource("{ID}");
        // download a specific song
        songItem.addMethod("GET",
            new apigateway.LambdaIntegration(downloadSongFunction));
        // delete a specific song
        songItem.addMethod("DELETE",
            new apigateway.LambdaIntegration(deleteSongFunction));
        // share song
        songItem.addMethod("PUT");

    }
}
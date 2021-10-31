#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {SiteStack} from './site-stack';
import {ApiStack} from "./api-stack";

const environment = {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION}

const app = new cdk.App();

new SiteStack(app, 'CdkStack',
    {domainName: "fiimusical.ml"},
    {env: environment,
    });
new ApiStack(app, 'APIStack', {env: environment});

import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3'
import * as s3Deployment from '@aws-cdk/aws-s3-deployment'
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';


export interface StaticSiteProps {
  domainName: string;
}

export class SiteStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, siteProps: StaticSiteProps, props?: cdk.StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    new s3Deployment.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3Deployment.Source.asset("../site-contents")],
      destinationBucket: siteBucket
    });

    const siteCertificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName: siteProps.domainName,
      subjectAlternativeNames: [`*.${siteProps.domainName}`, `www.${siteProps.domainName}`],
      validation: acm.CertificateValidation.fromDns(), // Records must be added manually
    });

    new cloudfront.CloudFrontWebDistribution(this, "SiteDistribution", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
          siteCertificate,
          {
            aliases: [siteProps.domainName, `www.${siteProps.domainName}`],
            securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            sslMethod: cloudfront.SSLMethod.SNI,
          },
      )
    });

  }
}

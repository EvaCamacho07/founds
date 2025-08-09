import { DynamoDB } from 'aws-sdk';

/**
 * AWS configuration for DynamoDB
 */
export const dynamoDBConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // For local development
};

/**
 * DynamoDB client instance
 */
export const dynamoClient = new DynamoDB.DocumentClient(dynamoDBConfig);

/**
 * DynamoDB table name
 */
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'fpv-fic-system';

/**
 * DynamoDB table configuration
 */
export const tableConfig = {
  TableName: TABLE_NAME,
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH'
    },
    {
      AttributeName: 'SK',
      KeyType: 'RANGE'
    }
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S'
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S'
    },
    {
      AttributeName: 'GSI1PK',
      AttributeType: 'S'
    },
    {
      AttributeName: 'GSI1SK',
      AttributeType: 'S'
    }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        {
          AttributeName: 'GSI1PK',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'GSI1SK',
          KeyType: 'RANGE'
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      BillingMode: 'PAY_PER_REQUEST'
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

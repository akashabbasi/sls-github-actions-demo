'use strict';
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { NodeHttpHandler } = require('@aws-sdk/node-http-handler');
const {
  PutCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const requestHandler = new NodeHttpHandler({
  connectionTimeout: 5000,
});

const client = new DynamoDBClient({
  region: 'us-east-1',
  maxAttempts: 3,
  requestHandler,
});
const docClient = DynamoDBDocumentClient.from(client);

const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
};

module.exports.createNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let data = JSON.parse(event.body);
  try {
    const input = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body,
      },
      ConditionExpression: 'attribute_not_exists(notesId)',
    };

    const command = new PutCommand(input);
    const response = await docClient.send(command);

    cb(null, send(201, data));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};

module.exports.updateNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters.id;
  let data = JSON.parse(event.body);

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: {
        notesId,
      },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body': 'body',
      },
      ExpressionAttributeValues: {
        ':title': data.title,
        ':body': data.body,
      },
      ConditionExpression: 'attribute_exists(notesId)',
    };

    const command = new UpdateCommand(params);
    const response = await docClient.send(command);
    cb(null, send(200, data));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};

module.exports.deleteNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters.id;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      ConditionExpression: 'attribute_exists(notesId)',
    };
    const command = new DeleteCommand(params);
    const response = await docClient.send(command);
    cb(null, send(200, notesId));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};

module.exports.getAllNotes = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
    };
    const command = new ScanCommand(params);
    const response = await docClient.send(command);
    cb(null, send(200, response.Items));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};

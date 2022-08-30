import { ddbClient } from "./ddbClient";

import {
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

exports.handler = async function (event) {
  console.log("request: ", JSON.stringify(event, undefined, 2));

  if (event.Records != null) {
    await sqsInvocation(event);
  } else if (event["detail-type"] !== undefined) {
    await eventBridgeInvocation(event);
  } else {
    return await apiGatewayInvocation(event);
  }
};

const eventBridgeInvocation = async (event) => {
  console.log(`eventBridgeInvocation function. Event: "${event}"`);
  await createOrder(event.detail);
};

const apiGatewayInvocation = async (event) => {
  console.log(
    "apiGatewayInvocation function. Request: ",
    JSON.stringify(event, undefined, 2)
  );

  try {
    let body;

    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters !== null) {
          body = await getOrder(event);
        } else {
          body = await getAllOrders(event);
        }
        break;

      default:
        throw new Error(`Unsopported route: "${event.httpMethod}`);
    }

    console.log(body);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body,
      }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to perform operation",
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };
  }
};

const sqsInvocation = async (event) => {
    console.log(`sqsInvocation function. Event: "${event}"`);

    event.Records.forEach(async (record) => {
        console.log(`Record: ${record}`);

        const checkoutEventRequest = JSON.parse(record.body);
        await createOrder(checkoutEventRequest.detail);
    })
};

const createOrder = async (basketCheckoutEvent) => {
  console.log(`createOrder function, Event: ${basketCheckoutEvent}`);

  try {
    const orderDate = new Date().toISOString();

    basketCheckoutEvent.orderDate = orderDate;
    console.log(basketCheckoutEvent);

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(basketCheckoutEvent || {}),
    };

    const createResult = await ddbClient.send(new PutItemCommand(params));
    console.log(createResult);

    return createResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
const getOrder = async (event) => {
  console.log("getOrder");

  try {
    const { userName } = event.pathParameters;

    const { orderDate } = event.queryStringParameters;

    const params = {
      KeyConditionExpression: "userName = :userName and orderDate = :orderDate",
      ExpressionAttributeValues: {
        ":userName": { S: userName },
        ":orderName": { S: orderDate },
      },
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new QueryCommand(params));

    console.log(Items);

    return Items.map((item) => unmarshall(item));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getAllOrders = async () => {
  console.log("getAllOrders");

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));
    console.log(Items);
    reutn(Items) ? Items.map((item) => unmarshall(item)) : {};
  } catch (error) {
    console.error(error);
    throw error;
  }
};

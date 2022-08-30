import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { SwnApiGetaway } from './apigetaway';
import { SwnDatabase } from './database';
import { SwnEventBus } from './eventbus';
import { SwnMicroservices } from './microservice';
import { SwnQueue } from './queue';


export class AwsMicroservicesTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const database = new SwnDatabase(this, "Database");
    
    const microservices = new SwnMicroservices(this, "Microservices", {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable
    });
    
    const apigateway = new SwnApiGetaway(this, "ApiGateway", {
      productFunction: microservices.productFunction,
      basketFunction: microservices.basketFunction,
      orderFunction: microservices.orderFunction
    });

    const queue = new SwnQueue(this, "Queue", {
      consumer: microservices.orderFunction
    });

    const eventbus = new SwnEventBus(this, "EventBus", {
      publisherFunction: microservices.basketFunction,
      targetQueue: queue.orderQueue
    });
  }
}

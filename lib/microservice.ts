import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { IFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface SwnMicroservicesProps {
    productTable: ITable,
    basketTable: ITable,
    orderTable: ITable
}

export class SwnMicroservices extends Construct {

    public readonly productFunction: IFunction;
    public readonly basketFunction: IFunction;
    public readonly orderFunction: IFunction;

    constructor(scope: Construct, id: string, props: SwnMicroservicesProps){
        super(scope, id);
        this.productFunction = this.createProductFunction(props.productTable);
        this.basketFunction = this.createBasketFunction(props.basketTable);
        this.orderFunction = this.createOrderFunction(props.orderTable);
    }

    private createProductFunction(productTable: ITable): NodejsFunction {
      const productFunctionProps: NodejsFunctionProps = {
        bundling: {
          externalModules: [
            'aws-sdk'
          ]
        },
        environment: {
          PRIMARY_KEY: "id",
          DYNAMODB_TABLE_NAME: productTable.tableName
        },
        runtime: Runtime.NODEJS_14_X
      }
  
      const productFunction = new NodejsFunction(this, 'productLambdaFunction', {
        entry: join(__dirname, '/../src/product/index.js'),
        ...productFunctionProps,
      });
      
      productTable.grantReadWriteData(productFunction);

      return productFunction
    }

    private createBasketFunction(basketTable: ITable): NodejsFunction{
      const basketFunctionProps: NodejsFunctionProps = {
        bundling: {
          externalModules: [
            'aws-sdk'
          ]
        },
        environment: {
          PRIMARY_KEY: "userName",
          DYNAMODB_TABLE_NAME: basketTable.tableName,
          EVENT_SOURCE: "com.swn.basket.checkoutbasket",
          EVENT_DETAILTYPE: "CheckoutBasket",
          EVENT_BUSNAME: "SwnEventBus"
        },
        runtime: Runtime.NODEJS_14_X
      }
  
      const basketFunction = new NodejsFunction(this, 'basketLambdaFunction', {
        entry: join(__dirname, '/../src/basket/index.js'),
        ...basketFunctionProps,
      });
      
      basketTable.grantReadWriteData(basketFunction);

      return basketFunction;
    }

    private createOrderFunction(orderTable: ITable): NodejsFunction{
      const orderFunctionProps = {

      }
      const orderFunction = new NodejsFunction(this, 'orderLambdaFunction', {
        entry: join(__dirname, '/../src/order/index.js'),
        ...orderFunctionProps
      });

      return orderFunction
    }
}
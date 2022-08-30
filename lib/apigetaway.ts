import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SwnApiProps {
    productFunction: IFunction,
    basketFunction: IFunction,
    orderFunction: IFunction
}

export class SwnApiGetaway extends Construct {

    constructor(scope: Construct, id: string, props: SwnApiProps){
        super(scope, id);
        this.createProductApi(props.productFunction);
        this.createBasketApi(props.basketFunction);
        this.createOrderApi(props.orderFunction);
    }

    private createProductApi(productFunction: IFunction) {
        const apigt = new LambdaRestApi(this, 'productApi', {
            restApiName: 'Product Service',
            handler: productFunction,
            proxy: false
        });
        
        const product = apigt.root.addResource("product");
        product.addMethod("GET");
        product.addMethod("POST");
    
        const singleProduct = product.addResource('{id}');
        singleProduct.addMethod('GET');
        singleProduct.addMethod('PUT');
        singleProduct.addMethod('DELETE');
    }

    private createBasketApi(basketFunction: IFunction) {
        const apigt = new LambdaRestApi(this, 'basketApi', {
            restApiName: 'Basket Service',
            handler: basketFunction,
            proxy: false
        });

        const basket = apigt.root.addResource("basket");
        basket.addMethod("GET");
        basket.addMethod("POST");

        const singleBasket = basket.addResource('{userName}');
        singleBasket.addMethod("GET");
        singleBasket.addMethod("DELETE")

        const checkoutBasket = basket.addResource("checkout");
        checkoutBasket.addMethod("POST");
    }

    private createOrderApi(orderFunction: IFunction){
        const apigt = new LambdaRestApi(this, 'orderApi', {
            restApiName: 'Order Service',
            handler: orderFunction,
            proxy: false
        });
        const order = apigt.root.addResource('order');
        order.addMethod('GET');

        const singleOrder = order.addResource('{userName}');
        singleOrder.addMethod('GET');
    }
}
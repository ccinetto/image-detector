import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';
import { Server } from 'http';
import * as express from 'express';
import { AppModule } from './app.module';

let server: Server;

async function createExpressServer(expressApp: express.Application) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.use(eventContext());
  app.enableCors();
  await app.init();
  return createServer(expressApp);
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!server) {
    const expressApp = express();
    server = await createExpressServer(expressApp);
  }
  return proxy(server, event, context, 'PROMISE').promise;
};
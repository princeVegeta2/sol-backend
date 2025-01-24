import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log("Creating nest factory App Module");
  const app = await NestFactory.create(AppModule);

  console.log("Enabling CORS");
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.PORT || 8080;
  console.log("Starting up...");
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();

# Image Detector Game - Deployment Guide

## Prerequisites
- Node.js 18.x or later
- AWS CLI configured with appropriate permissions
- Serverless Framework CLI

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Serverless Framework globally:**
   ```bash
   npm install -g serverless
   ```

3. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Deploy to AWS:**
   ```bash
   npm run deploy:dev
   ```

## Available Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run start:dev` - Start development server locally
- `npm run deploy:dev` - Deploy to development stage
- `npm run deploy:prod` - Deploy to production stage
- `npm run remove` - Remove all AWS resources
- `npm run offline` - Run serverless offline for local testing
- `npm run logs` - View Lambda function logs

## AWS Resources Created

- **Lambda Function**: Hosts the NestJS API
- **API Gateway**: Provides REST API endpoints
- **DynamoDB Tables**:
  - Questions table: Stores game questions and answers
  - Game Sessions table: Stores game sessions and player scores
- **S3 Buckets**:
  - Images bucket: Stores game images
  - Web App bucket: Hosts the frontend application

## API Endpoints

- `GET /` - Health check
- `POST /game/session` - Create new game session
- `GET /game/session/:sessionId` - Get game session details
- `POST /game/session/:sessionId/join` - Join a game session
- `POST /game/session/:sessionId/answer` - Submit answer
- `GET /game/session/:sessionId/leaderboard` - Get leaderboard
- `POST /questions` - Create new question
- `GET /questions` - Get all questions
- `GET /questions/:id` - Get specific question
- `GET /questions/random/:count` - Get random questions

## Environment Variables

The following environment variables are automatically set by Serverless:
- `QUESTIONS_TABLE` - DynamoDB questions table name
- `GAME_SESSIONS_TABLE` - DynamoDB game sessions table name
- `IMAGES_BUCKET` - S3 images bucket name
- `WEBAPP_BUCKET` - S3 web app bucket name

## Next Steps

1. Upload game images to the S3 images bucket
2. Create questions using the API endpoints
3. Build and deploy the frontend React/Vue.js application
4. Upload the frontend to the S3 web app bucket
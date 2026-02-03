# Deployment Guide

This project has two independent Serverless Framework projects:
- **Backend**: Lambda API + DynamoDB + S3 (images)
- **Frontend**: S3 static website hosting

## Prerequisites

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Backend Deployment

Deploy the backend API, DynamoDB tables, and images S3 bucket:

```bash
# From root
npm run backend:deploy

# Or from backend folder
cd backend
npm run deploy
```

This creates:
- Lambda function with NestJS API
- API Gateway endpoints
- DynamoDB tables (questions, games)
- S3 bucket for game images

## Frontend Deployment

Deploy the frontend S3 bucket and upload static files:

```bash
# From root
npm run frontend:deploy

# Or from frontend folder
cd frontend
npm run deploy
```

This creates:
- S3 bucket configured for static website hosting
- Uploads built React app to S3

## Deploy Both

```bash
npm run deploy:all
```

## Get Deployment Info

```bash
# Backend info
cd backend
npm run info

# Frontend info
cd frontend
npm run info
```

## Remove Resources

```bash
# Remove backend
npm run backend:remove

# Remove frontend
npm run frontend:remove

# Remove both
npm run remove:all
```

## Environment Variables

Backend uses these environment variables (set in serverless.yml or as env vars):
- `JWT_SECRET` - JWT signing secret
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password

## Outputs

After deployment:
- **Backend API URL**: Check backend deployment output
- **Frontend URL**: Check frontend deployment output (S3 website URL)

## Update Frontend API URL

After backend deployment, update the frontend to use the API URL:

1. Get backend API URL from deployment output
2. Update `frontend/src/services/api.ts` with the API URL
3. Redeploy frontend: `npm run frontend:deploy`

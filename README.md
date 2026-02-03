# Image Detector Game

A multiplayer quiz game where users answer questions about images in real-time rounds.

## Game Flow
- Multiple users join a game session
- Each round shows an image with a question
- Users submit answers
- Correct answer is revealed with the answer image
- Points are awarded based on correct answers
- Final leaderboard shows the winner

## Tech Stack
- **Frontend**: React + TypeScript (Vite)
- **Backend**: NestJS + TypeScript (AWS Lambda)
- **Infrastructure**: Serverless Framework
- **Database**: DynamoDB (questions + game sessions)
- **Storage**: S3 (images + frontend hosting)
- **Region**: us-east-1 (free tier)

## Monorepo Structure
```
image-detector/
├── packages/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── lambda.ts
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── app.controller.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   ├── frontend/         # React app
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   └── App.tsx
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── infra/            # Serverless config
│       ├── serverless.yml
│       └── package.json
├── package.json          # Root workspace
└── README.md
```

## Setup

```bash
# Install dependencies
npm install

# Backend development
npm run backend:dev

# Frontend development
npm run frontend:dev

# Build backend
npm run backend:build

# Build frontend
npm run frontend:build

# Deploy infrastructure
npm run infra:deploy

# Remove infrastructure
npm run infra:remove
```

## AWS Resources
- **Lambda**: API backend
- **API Gateway**: HTTP endpoints
- **DynamoDB**: 
  - `image-detector-questions-{stage}` - Questions and answers
  - `image-detector-games-{stage}` - Game sessions and scores
- **S3**:
  - `image-detector-images-{stage}` - Game images
  - `image-detector-frontend-{stage}` - Static website hosting


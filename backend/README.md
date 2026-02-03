# Backend API - Image Detector Game

## Overview
The backend is built with NestJS and provides HTTP REST API endpoints for authentication, question management, and game sessions.

## Architecture

### Authentication Flow
```
POST /auth/login
├── Validates admin credentials (username/password)
├── Generates JWT token (24h expiration)
└── Returns { access_token }
```

### Question Management (JWT Protected)
```
POST /questions
├── Validates JWT token
├── Accepts multipart/form-data
├── Uploads questionImage to S3
├── Uploads revealImage to S3
├── Stores question data in DynamoDB
└── Returns created question with S3 URLs

PUT /questions/:id
├── Validates JWT token
├── Updates question text/answer
├── Optionally uploads new images to S3
└── Returns updated question

DELETE /questions/:id
├── Validates JWT token
├── Removes question from DynamoDB
└── Returns success message

GET /questions
├── Public endpoint
└── Returns all questions

GET /questions/:id
├── Public endpoint
└── Returns single question

GET /questions/random/:count
├── Public endpoint
└── Returns random questions for game
```

### Game Session Flow
```
1. Create Session
POST /game/session
├── Body: { totalRounds: 5, creatorId: string }
├── Generates unique 6-character sessionId
├── Fetches random questions for the game
├── Initializes session with status 'waiting'
├── Stores creatorId (host)
└── Returns { sessionId, status, currentRound, totalRounds, questionIds, creatorId }

2. Players Join
POST /game/session/:sessionId/join
├── Body: { userId, username }
├── Adds player to session
├── Initializes score to 0 and empty answers array
└── Returns { message, player }

3. Get Session Details
GET /game/session/:sessionId
├── Returns array with session data and all players
└── Session has userId='session', players have their own userId

4. Host Starts Game
POST /game/session/:sessionId/start
├── Updates session status to 'playing'
├── All players in waiting room detect status change via polling
└── Returns { message }

5. Get Round Question
GET /game/session/:sessionId/round/:round
├── Returns question for specific round number
├── Questions are pre-selected when session is created
└── All players get same questions in same order

6. Submit Answer
POST /game/session/:sessionId/answer
├── Body: { userId, questionId, answer }
├── Validates answer against correct answer
├── Calculates points (100 for correct, 0 for wrong)
├── Appends answer to player's answers array
└── Returns { submitted, correct, points }

7. Get Reveal
GET /game/session/:sessionId/reveal/:userId/:questionId
├── Returns correct answer and reveal image
├── Returns user's answer and if it was correct
├── Returns points earned and current total score
└── Used to show results after each round

8. View Leaderboard
GET /game/session/:sessionId/leaderboard
├── Queries all players in session
├── Calculates stats (totalAnswers, correctAnswers)
├── Sorts by score (descending)
└── Returns sorted player list with stats

9. Restart Game (Host Only)
POST /game/session/:sessionId/restart
├── Generates new random questions
├── Resets session status to 'waiting'
├── Resets currentRound to 0
├── Clears all player answers and scores
├── All players redirected to waiting room via polling
└── Returns { message }
```

## Data Models

### Question
```typescript
{
  id: string                    // UUID
  question: string              // "It is A or B?"
  answer: string                // "A" or "B"
  questionImageUrl: string      // S3 URL
  revealImageUrl: string        // S3 URL
  createdAt: string            // ISO timestamp
}
```

### Game Session
```typescript
{
  sessionId: string             // 6-char code (e.g., "ABC123")
  userId: string                // "session" for session record
  status: string                // "waiting" | "playing"
  currentRound: number          // 0-5
  totalRounds: number           // Default: 5
  questionIds: string[]         // Array of question IDs for this game
  creatorId: string             // userId of the host
  players: Array<{              // Summary of players
    userId: string
    username: string
  }>
  createdAt: string            // ISO timestamp
}
```

### Player
```typescript
{
  sessionId: string             // Game session ID
  userId: string                // Unique player ID
  username: string              // Display name
  score: number                 // Total points
  answers: Array<{              // Answer history
    questionId: string
    answer: string
    correct: boolean
    points: number
    answeredAt: string
  }>
  joinedAt: string             // ISO timestamp
}
```

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | No | Admin login |
| `POST` | `/questions` | JWT | Create question with images |
| `PUT` | `/questions/:id` | JWT | Update question |
| `DELETE` | `/questions/:id` | JWT | Delete question |
| `GET` | `/questions` | No | List all questions |
| `GET` | `/questions/:id` | No | Get single question |
| `GET` | `/questions/random/:count` | No | Get random questions |
| `POST` | `/game/session` | No | Create game session |
| `GET` | `/game/session/:sessionId` | No | Get session details |
| `POST` | `/game/session/:sessionId/join` | No | Join game session |
| `POST` | `/game/session/:sessionId/start` | No | Start game (host only) |
| `GET` | `/game/session/:sessionId/round/:round` | No | Get question for round |
| `POST` | `/game/session/:sessionId/answer` | No | Submit answer |
| `GET` | `/game/session/:sessionId/reveal/:userId/:questionId` | No | Get answer reveal |
| `GET` | `/game/session/:sessionId/leaderboard` | No | Get leaderboard |
| `POST` | `/game/session/:sessionId/restart` | No | Restart game (host only) |

## AWS Resources

### DynamoDB Tables

**image-detector-questions-{stage}**
- Primary Key: `id` (String)
- Stores questions with S3 image URLs
- BillingMode: PAY_PER_REQUEST

**image-detector-games-{stage}**
- Primary Key: `sessionId` (String)
- Sort Key: `userId` (String)
- Stores game sessions and players
- BillingMode: PAY_PER_REQUEST

### S3 Buckets

**image-detector-images-{stage}**
- Stores question and reveal images
- Public read access
- CORS enabled for uploads

**image-detector-frontend-{stage}**
- Static website hosting
- Public read access

### Lambda Function
- Runtime: Node.js 18.x
- Handler: `dist/lambda.handler`
- Timeout: 30 seconds
- Memory: 512 MB (configurable)
- Integration: API Gateway HTTP proxy

## Environment Variables

```bash
QUESTIONS_TABLE=image-detector-questions-dev
GAMES_TABLE=image-detector-games-dev
IMAGES_BUCKET=image-detector-images-dev
JWT_SECRET=your-secret-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Security

### JWT Authentication
- Algorithm: HS256
- Expiration: 24 hours
- Protected endpoints: POST/PUT/DELETE /questions
- Public endpoints: All game and GET /questions

### File Upload
- Multipart form data
- Fields: `questionImage`, `revealImage`
- Max file size: 2MB per image
- Allowed formats: JPG, PNG
- Uploaded to S3 with unique keys
- Returns public S3 URLs

### AWS Limits
- API Gateway payload limit: 10MB
- Lambda synchronous invocation: 6MB
- Recommended max image size: 2MB per image (4MB total)
- Images exceeding 2MB will be rejected with error message

## Request/Response Examples

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Create Question
```bash
POST /questions
Authorization: Bearer {token}
Content-Type: multipart/form-data

question: "It is A or B?"
answer: "A"
questionImage: [file]
revealImage: [file]

Response:
{
  "id": "uuid",
  "question": "It is A or B?",
  "answer": "A",
  "questionImageUrl": "https://bucket.s3.amazonaws.com/...",
  "revealImageUrl": "https://bucket.s3.amazonaws.com/...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Create Game Session
```bash
POST /game/session
Content-Type: application/json

{
  "totalRounds": 5,
  "creatorId": "user-123"
}

Response:
{
  "sessionId": "ABC123",
  "status": "waiting",
  "currentRound": 0,
  "totalRounds": 5,
  "questionIds": ["q1-uuid", "q2-uuid", "q3-uuid", "q4-uuid", "q5-uuid"],
  "creatorId": "user-123",
  "players": [],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Join Session
```bash
POST /game/session/ABC123/join
Content-Type: application/json

{
  "userId": "user-123",
  "username": "Player1"
}

Response:
{
  "message": "Joined session successfully",
  "player": {
    "sessionId": "ABC123",
    "userId": "user-123",
    "username": "Player1",
    "score": 0,
    "joinedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Leaderboard
```bash
GET /game/session/ABC123/leaderboard

Response:
[
  {
    "sessionId": "ABC123",
    "userId": "user-123",
    "username": "Player1",
    "score": 400,
    "totalAnswers": 5,
    "correctAnswers": 4,
    "joinedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "sessionId": "ABC123",
    "userId": "user-456",
    "username": "Player2",
    "score": 300,
    "totalAnswers": 5,
    "correctAnswers": 3,
    "joinedAt": "2024-01-01T00:00:01.000Z"
  }
]
```

## Game Flow

1. **Host Creates Game**: Host enters name and creates session, automatically joins as first player
2. **Players Join**: Other players enter game code and username to join
3. **Waiting Room**: All players see each other, host has "Start Game" button
4. **Host Starts**: Status changes to "playing", all players navigate to game
5. **Gameplay**: Each round shows same question to all players (10 seconds to answer)
6. **Submit Answers**: Players submit A or B, or time runs out (auto-submit empty)
7. **Reveal**: Shows correct answer, reveal image, and points earned
8. **Next Round**: Automatically advances after 5 seconds
9. **Leaderboard**: After 5 rounds, shows final scores sorted by points
10. **Restart**: Host can restart game (new questions, reset scores, back to waiting room)

## Error Handling

- 401 Unauthorized: Invalid JWT token
- 404 Not Found: Session/Question not found
- 400 Bad Request: Invalid input data
- 500 Internal Server Error: Database/S3 errors

## Deployment

Deployed via Serverless Framework:
```bash
npm run infra:deploy
```

Infrastructure includes:
- Lambda function with NestJS app
- API Gateway HTTP endpoints
- DynamoDB tables
- S3 buckets with policies
- IAM roles and permissions

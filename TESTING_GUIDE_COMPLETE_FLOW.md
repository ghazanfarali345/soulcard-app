# 🎮 Soul Card Game - Complete Testing Guide

## Prerequisites

### Required Tools

- **Postman** (or Insomnia) - for API testing
- **MongoDB** - running and accessible
- **Node.js** - running the backend server
- **Valid JWT token** - from authentication

### Setup Steps Before Testing

1. **Start Backend Server**

   ```bash
   npm install
   npm start
   ```

   Server should be running on `http://localhost:3000`

2. **Verify Environment Variables**
   - `.env` file should have:
     - `GEMINI_API_KEY` - Set correctly
     - `MONGODB_URI` - Database connection
     - `JWT_SECRET` - For token signing

3. **Get Valid JWT Token**
   - Sign up or login to get a JWT token
   - Use this token for `Authorization: Bearer <token>` in all requests

---

## 🧪 Complete Testing Flow

### Step 1: Create Session (Initialize)

**Endpoint:** `POST /game-sessions/sessionDetails`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**

```json
{
  "soulSpace": "Academia",
  "vibe": "Behavior Science",
  "noOfPlayers": 1,
  "difficultyLevel": "medium",
  "engagementMode": "reflective",
  "engagement": "deep",
  "noOfQuestions": 3
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Session details collected successfully",
  "data": {
    "_id": "65a1234567890abcdef12345",
    "userId": "65a0234567890abcdef00000",
    "soulSpace": "Academia",
    "vibe": "Behavior Science",
    "noOfPlayers": 1,
    "difficultyLevel": "medium",
    "engagementMode": "reflective",
    "engagement": "deep",
    "noOfQuestions": 3,
    "status": "INITIALIZED",
    "answersSubmitted": 0,
    "questions": [],
    "results": null,
    "createdAt": "2026-04-26T10:00:00.000Z",
    "updatedAt": "2026-04-26T10:00:00.000Z"
  }
}
```

**Save:** `sessionId` = `65a1234567890abcdef12345` (for next steps)

---

### Step 2: Generate Questions

**Endpoint:** `POST /game-sessions/{sessionId}/generate-questions`

**Replace:** `{sessionId}` with value from Step 1

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:** Empty body or `{}`

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Questions generated successfully",
  "data": {
    "_id": "65a1234567890abcdef12345",
    "userId": "65a0234567890abcdef00000",
    "soulSpace": "Academia",
    "vibe": "Behavior Science",
    "noOfPlayers": 1,
    "difficultyLevel": "medium",
    "status": "QUESTIONS_GENERATED",
    "questions": [
      {
        "question": "What is the most important thing reinforcement teaches you about change in real life?",
        "modelAnswer": "What reinforcement teaches me most clearly is that behavior tends to follow what is strengthened, not what is merely talked about...",
        "scoring": {
          "depth": 9,
          "coherence": 9,
          "authenticity": 8,
          "openness": 8
        },
        "aiFeedback": "There's real clarity in the way you move from abstract advice to actual reinforcement..."
      },
      {
        "question": "What does studying living systems teach you about interconnectedness?",
        "modelAnswer": "Studying living systems makes it hard to believe anything exists in complete isolation...",
        "scoring": {
          "depth": 8,
          "coherence": 9,
          "authenticity": 8,
          "openness": 8
        },
        "aiFeedback": "The movement from individual organism to interconnected system is especially strong..."
      },
      {
        "question": "How does business strategy differ from activity?",
        "modelAnswer": "Being busy can create the appearance of importance, but value usually comes from clarity...",
        "scoring": {
          "depth": 9,
          "coherence": 10,
          "authenticity": 8,
          "openness": 8
        },
        "aiFeedback": "You've named an important tension between visible effort and real contribution..."
      }
    ]
  }
}
```

**Note:** Status is now `QUESTIONS_GENERATED`

---

### Step 3: Submit Answer to Question 1

**Endpoint:** `POST /game-sessions/{sessionId}/questions/0/answer`

**Replace:** `{sessionId}` with sessionId

**Note:** Question index is 0-based (0 = first question, 1 = second, 2 = third)

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**

```json
{
  "answer": "Reinforcement teaches me that behavior follows what gets rewarded, not just what we talk about. When I see people succeed, it's usually because something about their environment or habits makes those behaviors more likely. This changes how I think about motivation and change."
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "questionNumber": 1,
    "totalQuestions": 3,
    "score": {
      "similarityScore": 76,
      "metrics": {
        "reflective": 15,
        "coherence": 17,
        "openness": 14,
        "authenticity": 16
      }
    },
    "isLastQuestion": false
  }
}
```

**What to check:**

- ✅ `questionNumber` = 1
- ✅ `totalQuestions` = 3
- ✅ `isLastQuestion` = false (not the last question)
- ✅ `similarityScore` is 0-100
- ✅ Each metric is 0-20

---

### Step 4: Check Progress After Q1

**Endpoint:** `GET /game-sessions/{sessionId}/progress`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "sessionId": "65a1234567890abcdef12345",
    "totalQuestions": 3,
    "answersSubmitted": 1,
    "isComplete": false,
    "status": "IN_PROGRESS",
    "results": null
  }
}
```

**What to check:**

- ✅ `answersSubmitted` = 1
- ✅ `isComplete` = false
- ✅ `status` = "IN_PROGRESS"
- ✅ `results` = null (not complete yet)

---

### Step 5: Submit Answer to Question 2

**Endpoint:** `POST /game-sessions/{sessionId}/questions/1/answer`

**Request Body:**

```json
{
  "answer": "Living systems show me that nothing operates in isolation. Each organism depends on internal systems and external conditions constantly interacting. The more I study biology, the more I understand that independence is an illusion and life works through interconnection."
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "questionNumber": 2,
    "totalQuestions": 3,
    "score": {
      "similarityScore": 82,
      "metrics": {
        "reflective": 17,
        "coherence": 18,
        "openness": 15,
        "authenticity": 17
      }
    },
    "isLastQuestion": false
  }
}
```

**What to check:**

- ✅ `questionNumber` = 2
- ✅ `isLastQuestion` = false

---

### Step 6: Submit Answer to Question 3 (Last)

**Endpoint:** `POST /game-sessions/{sessionId}/questions/2/answer`

**Request Body:**

```json
{
  "answer": "Business strategy requires seeing beyond activity to actual value creation. Many organizations reward visible work even when it doesn't move meaningful things forward. Real management means understanding what truly matters and protecting that from distraction."
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "questionNumber": 3,
    "totalQuestions": 3,
    "score": {
      "similarityScore": 79,
      "metrics": {
        "reflective": 16,
        "coherence": 17,
        "openness": 16,
        "authenticity": 17
      }
    },
    "isLastQuestion": true
  }
}
```

**What to check:**

- ✅ `questionNumber` = 3
- ✅ `isLastQuestion` = true (**This triggers final results calculation**)

---

### Step 7: Check Final Progress

**Endpoint:** `GET /game-sessions/{sessionId}/progress`

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "sessionId": "65a1234567890abcdef12345",
    "totalQuestions": 3,
    "answersSubmitted": 3,
    "isComplete": true,
    "status": "COMPLETED",
    "results": {
      "overallScore": 79,
      "metrics": {
        "reflective": 16,
        "coherence": 17,
        "openness": 15,
        "authenticity": 17
      }
    }
  }
}
```

**What to check:**

- ✅ `isComplete` = true
- ✅ `status` = "COMPLETED"
- ✅ `results` object is populated
- ✅ `overallScore` = average of (76+82+79) = 79
- ✅ Each metric is average of per-question metrics

---

### Step 8: Get Detailed Final Results

**Endpoint:** `GET /game-sessions/{sessionId}/final-results`

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Results calculated successfully",
  "data": {
    "sessionId": "65a1234567890abcdef12345",
    "finalResults": {
      "overallScore": 79,
      "metrics": {
        "reflective": 16,
        "coherence": 17,
        "openness": 15,
        "authenticity": 17
      }
    },
    "answersBreakdown": [
      {
        "questionNumber": 1,
        "question": "What is the most important thing reinforcement teaches you about change in real life?",
        "userAnswer": "Reinforcement teaches me that behavior follows what gets rewarded...",
        "modelAnswer": "What reinforcement teaches me most clearly is that behavior tends to follow...",
        "score": {
          "similarityScore": 76,
          "metrics": {
            "reflective": 15,
            "coherence": 17,
            "openness": 14,
            "authenticity": 16
          }
        }
      },
      {
        "questionNumber": 2,
        "question": "What does studying living systems teach you about interconnectedness?",
        "userAnswer": "Living systems show me that nothing operates in isolation...",
        "modelAnswer": "Studying living systems makes it hard to believe anything exists in complete isolation...",
        "score": {
          "similarityScore": 82,
          "metrics": {
            "reflective": 17,
            "coherence": 18,
            "openness": 15,
            "authenticity": 17
          }
        }
      },
      {
        "questionNumber": 3,
        "question": "How does business strategy differ from activity?",
        "userAnswer": "Business strategy requires seeing beyond activity to actual value creation...",
        "modelAnswer": "Being busy can create the appearance of importance, but value usually comes from clarity...",
        "score": {
          "similarityScore": 79,
          "metrics": {
            "reflective": 16,
            "coherence": 17,
            "openness": 16,
            "authenticity": 17
          }
        }
      }
    ]
  }
}
```

**What to check:**

- ✅ Overall score calculation is correct
- ✅ Each metric is correct average
- ✅ All answers are detailed with scores
- ✅ Per-question scores match what was returned during submission

---

## 🧪 Error Scenarios to Test

### Error 1: Invalid Session ID

**Endpoint:** `GET /game-sessions/invalid-id/progress`

**Expected Response (404):**

```json
{
  "message": "Session not found",
  "statusCode": 404
}
```

---

### Error 2: Missing JWT Token

**Endpoint:** `POST /game-sessions/sessionDetails` (without Authorization header)

**Expected Response (401):**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

### Error 3: Invalid Answer Format

**Endpoint:** `POST /game-sessions/{sessionId}/questions/0/answer`

**Request Body:**

```json
{
  "notAnAnswer": "wrong field"
}
```

**Expected Response (400):**

```json
{
  "message": "Bad Request",
  "statusCode": 400
}
```

---

### Error 4: Question Index Out of Range

**Endpoint:** `POST /game-sessions/{sessionId}/questions/10/answer` (when only 3 questions)

**Request Body:**

```json
{
  "answer": "Some answer"
}
```

**Expected Response (400):**

```json
{
  "message": "Invalid question number",
  "statusCode": 400
}
```

---

## 📊 Scoring Verification

### Manual Calculation Check

Given these per-question scores:

- Q1: Similarity=76, Reflective=15, Coherence=17, Openness=14, Authenticity=16
- Q2: Similarity=82, Reflective=17, Coherence=18, Openness=15, Authenticity=17
- Q3: Similarity=79, Reflective=16, Coherence=17, Openness=16, Authenticity=17

**Verify Calculations:**

```
Overall Score = (76 + 82 + 79) / 3 = 237 / 3 = 79 ✓

Reflective = (15 + 17 + 16) / 3 = 48 / 3 = 16 ✓
Coherence = (17 + 18 + 17) / 3 = 52 / 3 = 17.33 → 17 ✓
Openness = (14 + 15 + 16) / 3 = 45 / 3 = 15 ✓
Authenticity = (16 + 17 + 17) / 3 = 50 / 3 = 16.67 → 17 ✓
```

---

## 🎯 Edge Cases to Test

### Test 1: Single Question Session

```json
{
  "soulSpace": "Academia",
  "vibe": "Philosophy",
  "noOfPlayers": 1,
  "difficultyLevel": "hard",
  "engagementMode": "reflective",
  "engagement": "deep",
  "noOfQuestions": 1
}
```

- Submit answer for Q1
- Verify `isLastQuestion` = true
- Check that results are calculated immediately

### Test 2: Multiple Players (Future Feature)

```json
{
  "noOfPlayers": 2
}
```

- Create session with 2 players
- Each player submits answers independently
- Verify each player sees only their scores initially
- Option to view leaderboard after all complete

### Test 3: Empty/Very Short Answer

```json
{
  "answer": "Yes."
}
```

- Submit very short answer
- Check similarity score is lower
- Check metrics reflect low quality

### Test 4: Very Long Answer

```json
{
  "answer": "Long text with hundreds of words explaining in great detail..."
}
```

- Submit very detailed answer
- Check if similarity and metrics change based on content quality

---

## 📱 Database Verification

### Check Session Document in MongoDB

```javascript
db.sessions.findOne({ _id: ObjectId('65a1234567890abcdef12345') });
```

Should show:

- `status`: "COMPLETED"
- `answersSubmitted`: 3
- `results`: {overallScore, metrics}

### Check UserAnswers Collection

```javascript
db.useranswers.find({ sessionId: ObjectId('65a1234567890abcdef12345') });
```

Should show:

- 3 documents (one per question)
- Each with `score` object
- Each with `answeredAt` timestamp

---

## 🚀 Performance Testing

### Test Load with Multiple Sessions

1. Create 10 sessions simultaneously
2. Generate questions for all
3. Submit answers for all
4. Measure response times
5. Check for any database bottlenecks

### Typical Response Times (Expected)

- Create session: **< 100ms**
- Generate questions: **3-5 seconds** (depends on Gemini API)
- Submit answer: **2-3 seconds** (depends on scoring AI call)
- Get progress: **< 100ms**
- Get final results: **< 200ms**

---

## ✅ Final Checklist

- [ ] All endpoints respond with correct status codes
- [ ] All scores are calculated correctly
- [ ] Per-question scores are returned immediately after submission
- [ ] Final aggregate scores match calculations
- [ ] Session status transitions correctly (INITIALIZED → QUESTIONS_GENERATED → IN_PROGRESS → COMPLETED)
- [ ] Error messages are clear and helpful
- [ ] JWT authentication is working
- [ ] Database is storing all data correctly
- [ ] `isLastQuestion` flag works correctly
- [ ] Results object is null until quiz is complete
- [ ] Metrics are 0-20, overall score is 0-100

---

## 📞 Troubleshooting

### Issue: Gemini API Error

**Solution:** Check GEMINI_API_KEY in .env file

### Issue: MongoDB Connection Error

**Solution:** Verify MONGODB_URI and check MongoDB is running

### Issue: Scoring Service Returns Wrong Values

**Solution:** Check that response parsing regex in `ScoringService` matches Gemini output

### Issue: "Question not found"

**Solution:** Remember question indices are 0-based (first = 0, second = 1, etc.)

### Issue: Status not updating

**Solution:** Check that `answersSubmitted` is being incremented correctly in database

---

Good luck with testing! 🎉

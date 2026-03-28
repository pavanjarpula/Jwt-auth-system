# 🔐 JWT Authentication System

A clean, production-ready REST API for user authentication built with **Node.js**, **Express**, **MongoDB**, and **JWT** — no Passport.js, no shortcuts.

---

## 🚀 Live Demo

> Coming soon after deployment

---

## 🛠 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Runtime     | Node.js                             |
| Framework   | Express.js                          |
| Database    | MongoDB + Mongoose                  |
| Auth        | JSON Web Tokens (`jsonwebtoken`)    |
| Hashing     | `bcrypt` (12 salt rounds)           |
| Frontend    | Vanilla HTML / CSS / JS             |

---

## 📁 Project Structure

```
backend/
├── public/
│   └── index.html              # Frontend UI
├── src/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # register, login, refresh, logout
│   │   └── userController.js   # GET /me
│   ├── middleware/
│   │   └── authenticate.js     # JWT verification middleware
│   ├── models/
│   │   ├── User.js             # User schema
│   │   └── RefreshToken.js     # Refresh token schema (with TTL)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   └── server.js               # Entry point
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

> **MongoDB**: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier) or a local instance.

### 4. Run the server
```bash
# Development
npm run dev

# Production
npm start
```

Open **http://localhost:5000** to see the frontend UI.

---

## 📡 API Endpoints

| Method | Endpoint               | Auth Required | Description                               |
|--------|------------------------|---------------|-------------------------------------------|
| POST   | `/api/auth/register`   | No            | Register a new user                       |
| POST   | `/api/auth/login`      | No            | Login and receive access + refresh tokens |
| POST   | `/api/auth/refresh`    | No            | Get a new access token                    |
| POST   | `/api/auth/logout`     | No            | Revoke the refresh token                  |
| GET    | `/api/user/me`         | Yes (Bearer)  | Get authenticated user's profile          |

---

## 📋 Request & Response Reference

### `POST /api/auth/register`
```json
// Request
{ "name": "Alice", "email": "alice@example.com", "password": "password123" }

// Response 201
{ "message": "Account created successfully.", "user": { "id": "...", "name": "Alice", "email": "alice@example.com" } }
```

### `POST /api/auth/login`
```json
// Request
{ "email": "alice@example.com", "password": "password123" }

// Response 200
{ "message": "Logged in successfully.", "accessToken": "<jwt>", "refreshToken": "<jwt>" }
```

### `GET /api/user/me`
```http
Authorization: Bearer <accessToken>

// Response 200
{ "user": { "_id": "...", "name": "Alice", "email": "alice@example.com", "createdAt": "..." } }
```

### `POST /api/auth/refresh`
```json
// Request
{ "refreshToken": "<jwt>" }

// Response 200
{ "message": "Access token refreshed.", "accessToken": "<new jwt>" }
```

### `POST /api/auth/logout`
```json
// Request
{ "refreshToken": "<jwt>" }

// Response 200
{ "message": "Logged out successfully." }
```

---

## 🔄 Authentication Flow

```
┌─────────┐                          ┌─────────┐          ┌──────────┐
│  Client │                          │   API   │          │ MongoDB  │
└────┬────┘                          └────┬────┘          └────┬─────┘
     │                                    │                    │
     │  POST /register  {name,email,pw}   │                    │
     │ ──────────────────────────────────>│                    │
     │                                    │  hash pw (bcrypt)  │
     │                                    │ ──────────────────>│
     │         201 { user }               │                    │
     │ <──────────────────────────────────│                    │
     │                                    │                    │
     │  POST /login  {email, password}    │                    │
     │ ──────────────────────────────────>│                    │
     │                                    │  find + compare    │
     │                                    │ ──────────────────>│
     │   200 { accessToken, refreshToken }│  store refreshToken│
     │ <──────────────────────────────────│ ──────────────────>│
     │                                    │                    │
     │  GET /me  (Bearer accessToken)     │                    │
     │ ──────────────────────────────────>│                    │
     │                                    │  verify JWT        │
     │         200 { user }               │  (no DB lookup)    │
     │ <──────────────────────────────────│                    │
     │                                    │                    │
     │  [access token expires in 15m]     │                    │
     │                                    │                    │
     │  POST /refresh  {refreshToken}     │                    │
     │ ──────────────────────────────────>│                    │
     │                                    │  verify JWT        │
     │                                    │  check DB exists   │
     │                                    │ ──────────────────>│
     │      200 { new accessToken }       │                    │
     │ <──────────────────────────────────│                    │
     │                                    │                    │
     │  POST /logout  {refreshToken}      │                    │
     │ ──────────────────────────────────>│                    │
     │                                    │  delete from DB    │
     │                                    │ ──────────────────>│
     │         200 { message }            │                    │
     │ <──────────────────────────────────│                    │
```

---

## 🧪 Testing Procedure

### Option A — Use the Frontend
Open **http://localhost:5000** and test the full flow through the UI.

### Option B — Postman / curl

**1. Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'
```

**2. Login** — copy both tokens from the response
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

**3. Access protected route**
```bash
curl http://localhost:5000/api/user/me \
  -H "Authorization: Bearer <accessToken>"
```

**4. Test token expiry** — set `ACCESS_TOKEN_EXPIRY=5s` in `.env`, restart, login, wait 5s, then hit `/me`
```json
{ "error": "TOKEN_EXPIRED", "message": "Your access token has expired. Please refresh it at POST /api/auth/refresh." }
```

**5. Refresh the token**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

**6. Logout then confirm revocation**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# Try refresh again — should return TOKEN_REVOKED
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

---

## 🔒 Security Design Decisions

| Decision | Reason |
|---|---|
| `bcrypt` with 12 salt rounds | Strong hashing that resists brute force while staying performant |
| Two separate JWT secrets | Compromise of access secret does not affect refresh tokens |
| Same error for wrong email/password | Prevents user enumeration attacks |
| Refresh tokens stored in MongoDB | Enables true logout — pure stateless JWTs cannot be revoked |
| MongoDB TTL index on refresh tokens | Expired tokens are auto-deleted with no cron job required |
| Short-lived access tokens (15 min) | Limits damage window if an access token is leaked |
| `password` field excluded from `/me` | `.select("-password")` ensures the hash is never sent to the client |
| No Passport.js | All logic is written explicitly — easier to audit and understand |

---

## 🚧 Potential Future Improvements

- **Refresh token rotation** — issue a new refresh token on every `/refresh` call and invalidate the old one (prevents replay attacks)
- **Rate limiting** on `/login` and `/register` using `express-rate-limit` to prevent brute force
- **HttpOnly cookie** for refresh token storage instead of response body (prevents XSS theft)
- **Email verification** on registration
- **Password reset** flow via email
- **Role-based access control** (admin, user roles)
- **Request logging** with Morgan

---

## 📄 License

MIT

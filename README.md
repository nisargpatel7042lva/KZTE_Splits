# KZTE Splits

**Peer-to-Peer Bill Splitting & Group Payment Application**

A mobile-first web application for splitting bills and managing group expenses using KZTE (EVO) stablecoin on Solana blockchain. Built for Superteam KZ and Intebix bounty program.

---

## 🎯 Project Overview

KZTE Splits enables users to:
- Split bills instantly with friends using KZTE stablecoin
- Create groups for recurring expenses
- Track balances and transaction history
- Pay directly via Solana blockchain (fast, low-cost)
- Manage wallets with QR code payments

**Target Users:** Students and young professionals (18-35) in Kazakhstan

---

## 🏗️ Architecture

### Monorepo Structure

```
KZTE_Splits/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── routes/        # Routing configuration
│   │   ├── store/         # Zustand state management
│   │   ├── lib/           # Utilities and API client
│   │   ├── types/         # TypeScript types
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── lib/           # Utilities
│   │   ├── types/         # TypeScript types
│   │   └── config/        # Configuration
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── package.json
│   └── tsconfig.json
└── package.json       # Root workspace config
```

---

## 🚀 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Notifications:** React Hot Toast

### Backend
- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + OTP (AWS SNS)
- **Blockchain:** Solana Web3.js + SPL Token
- **Validation:** Zod
- **Security:** Helmet, CORS, Rate Limiting

### Blockchain
- **Network:** Solana (Devnet for development, Mainnet for production)
- **Token:** KZTE (EVO) - Tenge-backed SPL token by Intebix
- **Wallet Management:** Server-side keypair encryption

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database
- AWS account (for SMS/OTP via SNS)
- Solana wallet (for testing)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd KZTE_Splits
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Database (use Supabase, Railway, or local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/kzte_splits

# JWT (generate secure random strings)
JWT_SECRET=your-256-bit-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Twilio (for OTP SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
# Either use a verified sender phone number or a Messaging Service SID
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
TWILIO_MESSAGING_SERVICE_SID=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
KZTE_TOKEN_MINT_ADDRESS=<your-token-mint-address>
WALLET_ENCRYPTION_KEY=your-256-bit-encryption-key

# Optional: Cloudinary for avatar uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Note:** In development, OTP codes are logged to console instead of being sent via SMS.

### 4. Set Up Database

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed with test data
npx prisma db seed
```

### 5. Configure Frontend Environment

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=KZTE Splits
VITE_SOLANA_NETWORK=devnet
```

### 6. Run Development Servers

**Option 1: Run both concurrently (from root)**

```bash
npm run dev
```

**Option 2: Run separately**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Access the app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health Check: http://localhost:3000/health

---

## 🔑 Key Features Implemented

### Backend API

#### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `POST /api/auth/setup-profile` - Set up user profile
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh access token

#### Splits
- `POST /api/splits/create` - Create new split (equal, custom, percentage, exact)
- `GET /api/splits/:id` - Get split details
- `GET /api/splits` - List user's splits
- `POST /api/splits/:id/pay` - Pay split amount (blockchain transaction)
- `PUT /api/splits/:id/cancel` - Cancel split

#### Groups
- `GET /api/groups` - List user's groups
- `POST /api/groups/create` - Create new group
- `GET /api/groups/:id` - Get group details with balances
- `POST /api/groups/:id/members` - Add member
- `DELETE /api/groups/:id/members/:userId` - Remove member
- `GET /api/groups/:id/balances` - Get simplified balances for settlement

#### Wallet
- `GET /api/wallet/balance` - Get KZTE balance from blockchain
- `GET /api/wallet/summary` - Get owed/owing summary
- `GET /api/wallet/address` - Get wallet address (for QR code)
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/add-funds` - Initiate add funds (mock)
- `POST /api/wallet/cash-out` - Cash out to bank (mock)

#### Transactions
- `GET /api/transactions` - List transactions with filters
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/:id` - Get transaction details

#### Contacts
- `GET /api/contacts` - Get contacts (users you've split with)

---

## 💡 Core Algorithms Implemented

### Split Calculation

**1. Equal Split**
- Divides amount equally among participants
- Handles rounding by adjusting first participant's amount
- Ensures sum exactly matches total

**2. Custom Amounts**
- Validates that custom amounts sum to total
- Allows manual distribution

**3. Percentage Split**
- Converts percentages to actual amounts
- Validates percentages sum to 100%
- Handles rounding discrepancies

**4. Exact Shares**
- Calculates who paid what
- Determines fair share per person
- Outputs simplified payments needed

### Debt Simplification

Greedy algorithm that minimizes the number of transactions needed to settle group balances:
- Separates creditors (owed money) and debtors (owe money)
- Matches largest creditor with largest debtor
- Reduces transaction count optimally

**Example:**
```
Before: A owes B $10, A owes C $10, D owes B $10, D owes C $10
After: A pays C $20, D pays B $20
(4 transactions → 2 transactions)
```

---

## 🔐 Security Features

- **JWT Authentication** with access/refresh token rotation
- **OTP Verification** with rate limiting (max 3 attempts)
- **Private Key Encryption** using AES-256
- **Rate Limiting** on all API endpoints
- **CORS Protection** with whitelisted origins
- **Input Validation** using Zod schemas
- **SQL Injection Prevention** via Prisma parameterized queries

---

## 🚢 Deployment

### Backend (Railway / Render)

1. Connect GitHub repository
2. Select `/backend` as root directory
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### Frontend (Vercel / Netlify)

1. Connect GitHub repository
2. Framework: Vite
3. Root directory: `/frontend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Set `VITE_API_BASE_URL` to backend URL
7. Deploy

### Database (Supabase / Railway)

1. Create PostgreSQL instance
2. Run migrations: `npx prisma migrate deploy`
3. Set `DATABASE_URL` in backend environment

---

## 📱 PWA Configuration

The app is configured as a Progressive Web App:
- Installable on mobile devices
- Offline fallback page
- Service worker for caching
- App manifest with icons

---

## 🎨 Design System

### Colors

- **Primary (Teal):** `#00B8A9` - Main brand color
- **Secondary (Gold):** `#F8B500` - Kazakhstan flag inspired
- **Success (Green):** `#06D6A0` - Positive actions
- **Error (Red):** `#EF476F` - Errors and debts
- **Background:** `#F7F9FC` - Light gray

### Typography

- **Font:** Inter (Google Fonts)
- **Sizes:** 12px - 36px scale
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

---

## 📄 License

MIT License - Built for Superteam KZ and Intebix bounty program.

---

## 🙏 Acknowledgments

- **Intebix** - KZTE (EVO) stablecoin issuer
- **Superteam KZ** - Kazakhstan crypto community
- **Solana Foundation** - Blockchain infrastructure

---

**Built with ❤️ for Kazakhstan's digital economy**

🚀 **Ready to split bills instantly with KZTE!**




# Hire Assist

An AI-powered recruitment platform that uses vector embeddings and semantic analysis to match candidates to job opportunities. Built with Next.js, Pinecone, and AI-powered analysis.

## 🎯 Overview

Hire Assist helps recruiters and hiring managers efficiently match candidates to job postings using advanced AI technology. The platform:

- **Creates job postings** and converts them to vector embeddings
- **Uploads and processes resumes** (PDF format) with automatic candidate name extraction
- **Performs semantic matching** using Pinecone vector database
- **Generates detailed analysis** with dual scoring (similarity + fit scores), matching skills, missing skills, and AI-generated summaries

## ✨ Features

### Core Functionality

- **Job Management**: Create, view, search, and delete job postings
- **Resume Processing**: Upload multiple PDF resumes with automatic text extraction and candidate name detection
- **AI-Powered Matching**: Vector similarity search using Pinecone for semantic matching
- **Dual Scoring System**: 
  - Vector similarity scores (0-100%)
  - AI-generated fit scores (0.0-1.0)
- **Detailed Analysis**: Matching skills, missing skills, and comprehensive summaries for each candidate
- **Bulk Operations**: Upload multiple resumes and bulk delete functionality
- **Analytics**: View matching results with filtering, sorting, and multiple view modes

### Technical Features

- **Vector Embeddings**: Uses Pinecone's `llama-text-embed-v2` model for embeddings
- **Text Chunking**: Intelligent character-based chunking for large documents
- **PDF Processing**: Automatic text extraction from PDF files
- **AI Analysis**: Groq-powered AI analysis using `llama-3.3-70b-versatile` model

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** (Neon) - Relational database
- **Pinecone** - Vector database for embeddings
- **Groq** - AI inference for analysis
- **PDF2JSON** - PDF text extraction

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm/yarn/pnpm
- **PostgreSQL database** (Neon recommended for serverless)
- **Pinecone account** with an index created
- **Groq API key** for AI analysis

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_index_name

# Groq AI
GROQ_API_KEY=your_groq_api_key
```

### Pinecone Setup

1. Create a Pinecone account at [pinecone.io](https://www.pinecone.io)
2. Create a new index with:
   - **Dimensions**: 1024 (for `llama-text-embed-v2`)
   - **Metric**: cosine
3. Copy your API key and index name to `.env.local`

### Database Setup

The app uses PostgreSQL with the following schema:

- **jobs**: Job postings with title and description
- **resumes**: Candidate resumes linked to jobs
- **comparisons**: Matching results with scores and analysis

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hire-assist
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Set up the database**
   ```bash
   # Generate migrations (if needed)
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Or push schema directly (development)
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
hire-assist/
├── app/
│   ├── api/                    # API routes
│   │   └── jobs/
│   │       ├── route.ts        # Job CRUD operations
│   │       └── [jobId]/
│   │           ├── route.ts    # Individual job operations
│   │           ├── resumes/    # Resume upload/management
│   │           └── match/      # Matching endpoint
│   ├── jobs/                   # Job management pages
│   │   ├── page.tsx            # Jobs list
│   │   └── [jobId]/
│   │       ├── page.tsx        # Job detail & resume management
│   │       └── matching/       # Matching results page
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Reusable UI components
│   └── navigation.tsx          # Navigation component
├── lib/
│   ├── db/                     # Database configuration
│   │   ├── schema.ts           # Drizzle schema
│   │   └── migrations/         # Database migrations
│   ├── chunk.ts                # Text chunking utility
│   ├── embeddings.ts           # Embedding generation
│   ├── pdf-utils.ts            # PDF processing & name extraction
│   └── pinecone.ts             # Pinecone client & utilities
└── public/                     # Static assets
```

## 🔌 API Endpoints

### Jobs

- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create a new job
- `GET /api/jobs/[jobId]` - Get job details
- `DELETE /api/jobs/[jobId]` - Delete a job

### Resumes

- `GET /api/jobs/[jobId]/resumes` - List resumes for a job
- `POST /api/jobs/[jobId]/resumes` - Upload resume(s)
- `DELETE /api/jobs/[jobId]/resumes/[resumeId]` - Delete a resume
- `POST /api/jobs/[jobId]/resumes/bulk-delete` - Bulk delete resumes

### Matching

- `POST /api/jobs/[jobId]/match` - Run matching analysis for a job

## 🗄️ Database Schema

### Jobs Table
- `id` (serial, primary key)
- `title` (text)
- `jdText` (text) - Job description text
- `createdAt` (timestamp)

### Resumes Table
- `id` (serial, primary key)
- `jobId` (integer, foreign key)
- `candidateName` (text)
- `fullText` (text) - Extracted resume text
- `createdAt` (timestamp)

### Comparisons Table
- `id` (serial, primary key)
- `userId` (text)
- `jobId` (integer)
- `resumeId` (integer)
- `similarity` (real) - Vector similarity score (0-1)
- `fitScore` (real) - AI-generated fit score (0-1)
- `matchingSkills` (text[]) - Array of matching skills
- `missingSkills` (text[]) - Array of missing skills
- `summary` (text) - AI-generated summary
- `createdAt` (timestamp)

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## 🔍 How It Works

1. **Job Creation**: When a job is created, the job description is embedded using Pinecone's inference API and stored in the `jobs` namespace.

2. **Resume Upload**: 
   - PDFs are uploaded and text is extracted
   - Candidate names are extracted using AI
   - Resume text is chunked into smaller pieces (~1800 characters)
   - Each chunk is embedded and stored in Pinecone's `resumes` namespace

3. **Matching**:
   - The job embedding is used as a query vector
   - Pinecone performs similarity search in the `resumes` namespace
   - Results are aggregated per resume (best match per candidate)
   - AI analysis generates fit scores, matching/missing skills, and summaries

4. **Analysis**: Results are displayed with filtering, sorting, and detailed views for each candidate comparison.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app is optimized for Vercel's serverless platform.

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- Netlify

Ensure your environment variables are set in your deployment platform.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Vector database powered by [Pinecone](https://www.pinecone.io)
- AI analysis by [Groq](https://groq.com)
- UI components from [Radix UI](https://www.radix-ui.com)

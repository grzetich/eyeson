# UX Analyst AI

An AI-powered UX analysis tool that provides instant expert-level feedback on website design and usability. Built with Google Gemini AI, Puppeteer, and React.

## Features

- **AI-Powered UX Critique**: Expert-level feedback using Google Gemini AI with vision capabilities
- **Accessibility Scanning**: WCAG compliance checking with axe-core
- **Multi-Device Analysis**: Screenshots and analysis across desktop, tablet, and mobile viewports
- **Comprehensive Reports**: Detailed, actionable recommendations with priority scoring
- **Real-time Analysis**: Live progress tracking and results

## Tech Stack

### Backend
- Node.js with Express
- Puppeteer for screenshot capture
- @axe-core/puppeteer for accessibility scanning
- Google Gemini AI for UX critique generation with vision analysis
- SQLite for data storage

### Frontend
- React with Vite
- Tailwind CSS for styling
- React Query for state management
- React Router for navigation

## Quick Start

### Prerequisites

1. **Node.js 18+** - Required for both backend and frontend
2. **Google Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ux-analyst-ai
   npm run install:all
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

   This starts both the backend (port 3000) and frontend (port 5173) concurrently.

4. **Open Browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/health

### Production Deployment

#### Option 1: Docker (Recommended)

1. **Build Frontend**
   ```bash
   cd frontend && npm run build && cd ..
   ```

2. **Set Environment Variables**
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   Or with nginx proxy:
   ```bash
   docker-compose --profile with-proxy up -d
   ```

#### Option 2: Manual Deployment

1. **Build Frontend**
   ```bash
   cd frontend && npm run build && cd ..
   ```

2. **Set Environment Variables**
   ```bash
   export NODE_ENV=production
   export GEMINI_API_KEY=your_api_key_here
   export PORT=3000
   ```

3. **Start Backend**
   ```bash
   cd backend && npm start
   ```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | - | **Required.** Your Google Gemini API key |
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `DATABASE_URL` | `sqlite:./data/uxanalyst.db` | Database connection |
| `SCREENSHOT_STORAGE_PATH` | `./data/screenshots` | Screenshot storage directory |
| `MAX_CONCURRENT_ANALYSES` | `3` | Maximum concurrent analyses |
| `ANALYSIS_TIMEOUT_MS` | `300000` | Analysis timeout (5 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | `10` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |

### Analysis Options

- **Analysis Types**:
  - `quick`: Basic UX review (~1 minute)
  - `comprehensive`: Detailed UX + accessibility (~3 minutes)

- **Viewports**:
  - `desktop`: 1920×1080
  - `tablet`: 768×1024
  - `mobile`: 375×667

## API Documentation

### Start Analysis
```http
POST /api/analyze
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "viewports": ["desktop", "tablet", "mobile"],
    "includeAccessibility": true,
    "analysisType": "comprehensive"
  }
}
```

### Get Analysis Result
```http
GET /api/analyze/{analysisId}
```

### Get HTML Report
```http
GET /api/analyze/{analysisId}/report
```

### Health Check
```http
GET /api/health
```

## Development

### Project Structure
```
ux-analyst-ai/
├── backend/                 # Express API server
│   ├── services/           # Core business logic
│   ├── routes/             # API routes
│   ├── database/           # Database setup
│   └── server.js           # Entry point
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── api/            # API client
│   └── dist/               # Built assets
├── data/                   # Runtime data (screenshots, DB)
└── docker-compose.yml      # Production deployment
```

### Available Scripts

```bash
# Development
npm run dev                 # Start both backend and frontend
npm run dev:backend         # Start only backend
npm run dev:frontend        # Start only frontend

# Building
npm run build              # Build frontend
npm run install:all        # Install all dependencies

# Testing
npm test                   # Run backend tests
```

### Adding New Features

1. **Backend Services**: Add to `backend/services/`
2. **API Routes**: Add to `backend/routes/`
3. **Frontend Components**: Add to `frontend/src/components/`
4. **Database Changes**: Modify `backend/database/init.js`

## Troubleshooting

### Common Issues

1. **Puppeteer Chrome Issues**
   ```bash
   # Linux: Install dependencies
   sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2

   # Docker: Already included in Dockerfile
   ```

2. **Gemini API Errors**
   - Verify API key is set correctly
   - Check API usage limits and quotas
   - Ensure Gemini API access is enabled

3. **Out of Memory**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

4. **Screenshots Not Loading**
   - Check file permissions in `data/screenshots/`
   - Verify `SCREENSHOT_STORAGE_PATH` is correct
   - Ensure sufficient disk space

### Performance Optimization

- **Reduce Concurrent Analyses**: Lower `MAX_CONCURRENT_ANALYSES`
- **Optimize Screenshots**: Reduce viewport sizes or skip viewports
- **Database**: Consider PostgreSQL for production
- **Caching**: Add Redis for session caching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check this README and troubleshooting section
2. Review the [docs](../docs/) for architecture details
3. Open an issue with reproduction steps

---

**Note**: This is an MVP implementation. See the roadmap in the docs for planned enhancements including Figma integration, team collaboration, and enterprise features.
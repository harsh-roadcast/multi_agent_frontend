# Multi-Agent LLM Chatbot - Frontend

A professional, user-friendly React frontend for the Multi-Agent LLM Chatbot system. Built with modern technologies and featuring a clean white & blue design theme.

## 🚀 Features

- **AI Chat Interface** - Interactive chat with AI assistant featuring real-time responses
- **Datasource Management** - Register, list, and index various data sources
- **Agent Management** - Create and manage specialized AI agents with different capabilities
- **Data Ingestion** - Upload files, input text, or fetch URLs for processing
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Professional UI** - Clean white & blue theme with smooth animations

## 🛠️ Tech Stack

- **React 18.2** - Modern UI framework
- **Vite 5.0** - Fast build tool and dev server
- **React Router 6.20** - Client-side routing
- **Axios 1.6** - HTTP client for API calls
- **Lucide React** - Beautiful icon library
- **CSS3** - Custom styles with CSS variables

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Backend API running on `http://localhost:8000`

## 🔧 Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## 🏃 Running the Application

### Development Mode

Start the development server with hot reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Create an optimized production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Sidebar.jsx
│   │   └── Sidebar.css
│   ├── pages/          # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Dashboard.css
│   │   ├── Chat.jsx
│   │   ├── Chat.css
│   │   ├── Datasources.jsx
│   │   ├── Datasources.css
│   │   ├── Agents.jsx
│   │   ├── Agents.css
│   │   ├── Ingestion.jsx
│   │   └── Ingestion.css
│   ├── services/       # API service layer
│   │   └── api.js
│   ├── App.jsx         # Main app component
│   ├── App.css         # Global app styles
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles & theme
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies & scripts
```

## 🎨 Theme & Styling

The application uses a professional white & blue color scheme:

- **Primary Blue**: #2563eb
- **Blue Variants**: #1d4ed8, #3b82f6, #60a5fa
- **Background**: White (#ffffff) and Off-white (#f8fafc)
- **Grayscale**: Various shades from #f9fafb to #111827

CSS variables are defined in `src/index.css` for easy customization.

## 🔌 API Integration

The frontend communicates with the backend API at `http://localhost:8000`. The Vite dev server proxies API requests to avoid CORS issues.

### API Endpoints Used:

- `POST /chat` - Send chat messages
- `GET /datasources` - List datasources
- `POST /datasources/register` - Register new datasource
- `POST /datasources/index` - Index a datasource
- `GET /agents` - List agents
- `POST /agents/register` - Register new agent
- `POST /agents/query` - Query an agent
- `POST /ingestion` - Ingest data
- `GET /health` - Health check

See `src/services/api.js` for complete API documentation.

## 📱 Pages Overview

### Dashboard
- System health status
- Quick statistics (datasources count, agents count)
- Quick start guide
- System information

### Chat
- Interactive chat interface
- Real-time message streaming
- User and bot message differentiation
- Timestamp display

### Datasources
- List all registered datasources
- Register new datasources (Database, API, File, Web)
- Index datasources for AI retrieval
- View connection details and status

### Agents
- Manage AI agents with different capabilities
- Register agents with specific skills
- Query agents directly
- View agent capabilities and connected datasources

### Ingestion
- Upload files (TXT, PDF, DOC, CSV, JSON)
- Direct text input
- URL content fetching
- Choose target collection
- View ingestion results

## 🔄 Development Workflow

1. Make changes to source files
2. Vite hot reload automatically updates the browser
3. Test functionality in the browser
4. Build for production when ready

## 🧪 Testing

The backend must be running for full functionality:

```bash
# In the project root directory
python -m src.main
```

Then access the frontend at `http://localhost:3000`

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Serve Static Files

You can serve the built files using any static file server:

```bash
# Using the preview command
npm run preview

# Or using a static server like serve
npx serve dist
```

### Environment Variables

Configure the API base URL in `src/services/api.js` for different environments:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or specify a different port
npm run dev -- --port 3001
```

### API Connection Issues
- Ensure backend is running on port 8000
- Check CORS settings in backend
- Verify proxy configuration in `vite.config.js`

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is part of the Multi-Agent LLM Chatbot system.

## 🔗 Related

- Backend API: Located in the `src/` directory of the main project
- Documentation: See `docs/` directory for detailed documentation

## 💡 Tips

- Use browser DevTools to inspect network requests
- Check Console for error messages
- Enable React DevTools for component debugging
- Monitor the backend logs for API errors

---

Built with ❤️ using React + Vite

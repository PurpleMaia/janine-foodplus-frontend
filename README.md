# Food+ Frontend

A Next.js application for tracking and managing legislative bills related to food and agriculture in Hawaiʻi.

## 🚀 Quick Start

For new developers, start here:

- **[Documentation](https://docs.google.com/document/d/1AfSlVQL6Goa0vftZcmlbjmZm0e4FAia_K9tFNcEtCz0/edit?tab=t.5z5e7zjoq9f7#heading=h.s7e9sd14kbu0)** - Comprehensive setup documentation

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Git
- PostgreSQL (optional, for local development)

## 🏃‍♂️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:9002
```

## 🏗️ Tech Stack

### Frontend
- **Next.js 15.2.3** - React framework with app router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components

### Backend Services
- **PostgreSQL** - Primary database
- **OpenAI API** - LLM for bill classification
- **Google AI (Gemini)** - AI operations via Genkit
- **External Scraping API** - Legislative data scraping

### State Management
- **React Query/TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 📁 Project Structure

```
src/
├── ai/                 # AI/ML integration
├── app/               # Next.js app router pages
├── components/        # React components
│   ├── kanban/       # Kanban board components
│   ├── llm/          # AI-related UI components
│   ├── new-bill/     # Bill creation components
│   ├── scraper/      # Web scraping UI components
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and constants
├── services/         # Backend services (Server Actions)
└── types/            # TypeScript type definitions
```

## 🎯 Key Features

- **Kanban Board**: Visual bill management and tracking
- **AI Classification**: Automatic bill status classification using LLMs
- **Real-time Updates**: Live bill status updates
- **Bill Creation**: Add and manage new legislative bills
- **Food-related Filtering**: Specialized filtering for food/agriculture bills

## 📚 Documentation

- **[Developer Setup Guide](DEV_SETUP.md)** - Complete setup instructions
- **[Quick Start Guide](QUICK_START.md)** - Fast setup for experienced developers
- **[Project Milestones](MILESTONES.md)** - Development roadmap
- **[Blueprint Documentation](docs/blueprint.md)** - Technical architecture

## 🤝 Contributing

1. Check the **[Documentation](https://docs.google.com/document/d/1AfSlVQL6Goa0vftZcmlbjmZm0e4FAia_K9tFNcEtCz0/edit?tab=t.5z5e7zjoq9f7#heading=h.s7e9sd14kbu0)**
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

- Check existing documentation
- Review project issues
- Ask team members for guidance

## 📄 License

[Add your license information here]

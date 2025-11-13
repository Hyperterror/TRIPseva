# TripSync - AI-Powered Group Travel Planning

A Next.js application that helps travelers find compatible travel companions and plan trips together with personalized recommendations.

## 🌟 Features

### Core Features
- **User Preferences** - Lifestyle and food preference management
- **Smart Matching** - AI-powered compatibility scoring for travel companions
- **Restaurant Recommendations** - Personalized dining suggestions integrated into itineraries
- **User Ratings** - Rate and review travel companions
- **Open Groups** - Discover and join compatible travel groups
- **Trip Planning** - Create and manage group trips with AI-generated itineraries

### Key Highlights
- ✅ Enhanced compatibility matching (lifestyle, food, accommodation)
- ✅ Google Places API integration for restaurant recommendations
- ✅ Real-time compatibility filtering
- ✅ Member ratings and reviews
- ✅ Responsive design with TripSync design system

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Clerk account (for authentication)
- Google Places API key (for restaurant recommendations)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## 📖 Documentation

All documentation is in the `/docs` folder:

- **[Project Status](./docs/PROJECT_STATUS.md)** - Current completion status
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - How to test features
- **[Setup Guide](./docs/SETUP.md)** - Detailed setup instructions
- **[Design System](./docs/DESIGN_SYSTEM.md)** - UI/UX guidelines

## 🧪 Testing

### Seed Test Data
```bash
npx tsx src/scripts/seed-test-groups.ts
```

### Test Features
- `/open-groups` - Browse compatible travel groups
- `/preferences` - Manage your preferences
- `/profile` - View your ratings
- `/trips` - See your trips
- `/create` - Create a new trip

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: Clerk
- **External APIs**: Google Places API
- **Styling**: Custom design system with CSS variables

## 📁 Project Structure

```
tripsync/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── open-groups/       # Open groups page
│   │   ├── preferences/       # Preferences page
│   │   └── ...
│   ├── components/            # React components
│   │   ├── compatibility/     # Compatibility badge
│   │   ├── preferences/       # Preference forms
│   │   ├── ratings/          # Rating components
│   │   └── restaurants/      # Restaurant cards
│   ├── models/               # MongoDB models
│   ├── services/             # Business logic services
│   ├── lib/                  # Utilities
│   ├── hooks/                # Custom React hooks
│   └── db/                   # Database config & migrations
├── docs/                     # Documentation
└── .kiro/specs/             # Feature specifications
```

## 🎯 Current Status

**85% Complete - MVP Ready!**

✅ All core features implemented
✅ All UI components working
✅ All API endpoints functional
⚠️ Testing and production optimizations pending

See [PROJECT_STATUS.md](./docs/PROJECT_STATUS.md) for details.

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Private - All rights reserved

---

**Built with ❤️ for travelers who want to find their perfect travel companions**

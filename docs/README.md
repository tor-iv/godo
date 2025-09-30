# Godo Documentation

Streamlined documentation for the Godo event discovery app.

## Quick Start

**New to Godo?** Start here:
1. [Setup Guide](setup/LOCAL_DEV_README.md) - Get your development environment running
2. [Architecture Overview](architecture/BACKEND_ARCHITECTURE.md) - Understand the system design
3. [Design System](design/DESIGN_SYSTEM.md) - Learn the UI/UX patterns

---

## Core Documentation

### 🏗️ Architecture

**[BACKEND_ARCHITECTURE.md](architecture/BACKEND_ARCHITECTURE.md)**
Complete backend system architecture including:
- Database schema design
- ML recommendation pipeline
- API structure and endpoints
- Real-time features with Supabase
- Background job system (Celery)
- Security and privacy controls

**[BACKEND_README.md](architecture/BACKEND_README.md)**
Backend implementation overview and development guide.

**[GODO_APP_STRUCTURE_REVIEW.md](architecture/GODO_APP_STRUCTURE_REVIEW.md)**
Frontend code organization and component structure.

**[USER_PROFILE_ARCHITECTURE.md](architecture/USER_PROFILE_ARCHITECTURE.md)**
User profile system design and implementation.

### 🎨 Design

**[DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md)** ⭐ **Primary Design Reference**
Complete design system including:
- British Racing Green color palette
- Flat design principles (no shadows/gradients)
- Typography scale and font stack
- Component specifications
- Spacing and layout patterns
- Touch targets and accessibility
- Animation guidelines

**[UI_UX_DESIGN_GUIDE.md](design/UI_UX_DESIGN_GUIDE.md)**
Extended design philosophy and implementation details inspired by Anthropic's minimalism and Beli's premium feel.

### ⚡ Features

**[ENHANCED_SWIPE_SYSTEM.md](features/ENHANCED_SWIPE_SYSTEM.md)**
Complete specification for the 4-direction swipe system:
- Right: Add to private calendar
- Up: Share with friends
- Left: Not interested
- Down: Maybe later
- Long press: Friend invitation flow

Includes database models, API endpoints, and social features.

### 🚀 Deployment

**[DEPLOYMENT.md](DEPLOYMENT.md)** ⭐ **Production Deployment Guide**
Complete production deployment guide:
- Railway/Render backend deployment
- Supabase database setup
- Mobile app deployment (iOS/Android via EAS)
- Environment configuration
- CI/CD pipeline
- Health checks and monitoring
- Cost estimates (~$45-75/mo)

### 🛠️ Setup & Development

**[LOCAL_DEV_README.md](setup/LOCAL_DEV_README.md)** ⭐ **Start Here**
Local development environment setup:
- Quick start commands
- Local vs Docker workflows
- Mobile testing options
- Troubleshooting guide
- VS Code integration

**[DOCKER_README.md](setup/DOCKER_README.md)**
Containerized development environment with Docker Compose.

**[day-1-setup-guide.md](setup/day-1-setup-guide.md)**
Day 1 onboarding guide for new developers.

### 🗄️ Database

**[database.sql](database/database.sql)**
Complete database schema with all tables, relationships, and indexes.

**[MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)**
Database migration instructions and best practices.

### 🔧 Technical Notes

**[REACT_NATIVE_TEXT_RENDERING_ISSUE.md](technical/REACT_NATIVE_TEXT_RENDERING_ISSUE.md)**
Documentation of React Native text rendering fixes and workarounds.

---

## Documentation Structure

```
docs/
├── README.md                    # This file
├── DEPLOYMENT.md                # Production deployment guide
├── architecture/                # System architecture
│   ├── BACKEND_ARCHITECTURE.md  # Backend system design
│   ├── BACKEND_README.md
│   ├── GODO_APP_STRUCTURE_REVIEW.md
│   └── USER_PROFILE_ARCHITECTURE.md
├── design/                      # Design system
│   ├── DESIGN_SYSTEM.md         # Complete design system (primary reference)
│   └── UI_UX_DESIGN_GUIDE.md    # Extended design guide
├── features/                    # Feature specifications
│   └── ENHANCED_SWIPE_SYSTEM.md # Swipe system implementation
├── setup/                       # Development setup
│   ├── LOCAL_DEV_README.md      # Local environment setup
│   ├── DOCKER_README.md         # Docker setup
│   └── day-1-setup-guide.md     # Onboarding guide
├── database/                    # Database schemas
│   ├── database.sql             # Complete schema
│   └── MIGRATION_GUIDE.md
└── technical/                   # Technical notes
    └── REACT_NATIVE_TEXT_RENDERING_ISSUE.md
```

---

## Finding What You Need

### "How do I..."

**...set up my development environment?**
→ [setup/LOCAL_DEV_README.md](setup/LOCAL_DEV_README.md)

**...understand the app architecture?**
→ [architecture/BACKEND_ARCHITECTURE.md](architecture/BACKEND_ARCHITECTURE.md)

**...implement a new UI component?**
→ [design/DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md)

**...deploy to production?**
→ [DEPLOYMENT.md](DEPLOYMENT.md)

**...work with the swipe system?**
→ [features/ENHANCED_SWIPE_SYSTEM.md](features/ENHANCED_SWIPE_SYSTEM.md)

**...modify the database schema?**
→ [database/database.sql](database/database.sql) + [database/MIGRATION_GUIDE.md](database/MIGRATION_GUIDE.md)

### "I'm working on..."

**Backend API development**
→ [architecture/BACKEND_ARCHITECTURE.md](architecture/BACKEND_ARCHITECTURE.md) + [architecture/BACKEND_README.md](architecture/BACKEND_README.md)

**Frontend UI components**
→ [design/DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md) + [architecture/GODO_APP_STRUCTURE_REVIEW.md](architecture/GODO_APP_STRUCTURE_REVIEW.md)

**ML recommendations**
→ [architecture/BACKEND_ARCHITECTURE.md](architecture/BACKEND_ARCHITECTURE.md) (Machine Learning section)

**Social features**
→ [features/ENHANCED_SWIPE_SYSTEM.md](features/ENHANCED_SWIPE_SYSTEM.md) (Friend invitation flow)

**Database queries**
→ [database/database.sql](database/database.sql)

---

## Contributing to Docs

When adding or updating documentation:

1. **Keep it current** - Update docs when you change code
2. **Be specific** - Include code examples and exact commands
3. **Stay organized** - Put docs in the right directory
4. **Link generously** - Reference related docs
5. **Update this README** - Add new docs to the structure above

### Documentation Standards

- Use clear, descriptive headings
- Include code examples with syntax highlighting
- Provide "Quick Start" sections for complex topics
- Link to related documentation
- Keep a table of contents for long docs
- Use diagrams where helpful (Mermaid is supported)
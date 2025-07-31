# Backend .clinerules - Event Discovery App

## Project Context
Tinder-like event discovery app for NYC young professionals. Users swipe events to build personal calendars.

## Tech Stack
- **Python 3.9+ with FastAPI**
- **Supabase (PostgreSQL + Auth)**
- **Pydantic for validation**
- **Async/await patterns**
- **Docker deployment**

## Core Business Rules
```python
# Swipe Actions
RIGHT = "want_to_go"      # Add to calendar
LEFT = "not_interested"   # Remove from feed
UP = "save_later"         # Save for future
DOWN = "like_cant_go"     # Like but can't attend

# Feed Modes
"happening_now"    # Next 48 hours
"planning_ahead"   # 3 days to 2 months

# Privacy Levels
"private"          # Default - only user sees
"friends_only"     # Friends see public events
"public_events"    # Public events visible
```

## Key Validations
- **NYC Location Required**: Validate on registration
- **No Duplicate Swipes**: Users can't swipe same event twice
- **One Action Per Event**: Can't change swipe decisions
- **Rate Limit**: 100 swipes per user per day
- **Age Range**: 22-35 years old target
- **Calendar Privacy**: Default to private

## Database Rules
- Use `uuid` primary keys
- Include `created_at`, `updated_at` timestamps
- Soft deletes with `deleted_at`
- Index foreign keys and query fields

## API Standards
- RESTful endpoints (`/api/v1/`)
- Consistent response: `{"data": {}, "success": bool, "message": ""}`
- Cursor-based pagination for feeds
- JWT authentication via Supabase
- Rate limiting on all endpoints

## Friend & Social Rules
- Friends can see mutual event interest
- Friends can see public event attendance (concerts, festivals)
- Friends CANNOT see: dining reservations, saved stacks, private events
- No random friend discovery - mutual connections only

## Event Management
- Manual curation required before events go live
- Auto-remove expired events after 7 days
- Events need: title, date, location, category, image
- Maximum 2 categories per event
- Hide events at 90% capacity

## Performance & Security
- Connection pooling for database
- Redis caching for feeds
- 15-second timeout for external APIs
- Input validation and sanitization
- HTTPS only
- Hash/encrypt sensitive data

## File Structure
```
/models     - Pydantic models
/services   - Business logic  
/routers    - API endpoints
/utils      - Helper functions
/tests      - Test files
```

## Error Handling
- Custom exceptions for business logic
- Structured error responses with codes
- Log database queries over 100ms
- Graceful degradation for external API failures

## Integration Requirements
- **Resy/OpenTable**: Restaurant reservations
- **Calendar Sync**: Google/Apple calendars
- **Push Notifications**: Event reminders
- **Maps**: Google Maps integration
- **Image Storage**: Supabase storage

## DO NOT
- Trust client-sent user IDs (extract from JWT)
- Allow duplicate swipes on same event
- Show expired events in feeds
- Put business logic in route handlers
- Use synchronous database calls
- Return internal errors to clients
- Store location data more precise than neighborhood level
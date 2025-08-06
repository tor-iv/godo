# Enhanced Swipe System & Calendar Management

## Overview
Implementation plan for enhanced 4-direction swipe system with friend invitations, calendar management, and real-time social features for the Godo event discovery app.

## Swipe System Design

### 1. Swipe Actions & Mapping

#### Primary Swipe Directions
- **Right Swipe**: "Going" (Private Calendar)
  - Adds event to user's private calendar
  - Visible only to the user
  - Creates `event_attendance` record with `visibility: 'private'`
  
- **Left Swipe**: "Not Interested"
  - Removes event from feed permanently
  - Creates negative signal for ML recommendations
  - No calendar entry created
  
- **Up Swipe**: "Going" (Share with Friends)
  - Adds event to user's shared calendar
  - Visible to friends based on privacy settings
  - Creates `event_attendance` record with `visibility: 'friends'`
  - Enables friend invitations and social features
  
- **Down Swipe**: "Maybe Later"
  - Saves event for future consideration
  - Moves to "Saved Events" section
  - Creates `event_attendance` record with `status: 'maybe'`

#### Long-Press Enhancement
- **Any Direction + Long Press (800ms+)**: Friend Invitation Flow
  - Triggers friend selection modal
  - Allows inviting specific friends to the event
  - Automatically sets event to shared visibility
  - Sends push notifications to invited friends

### 2. Data Model Updates

#### Enhanced Event Attendance Schema
```sql
-- Updated event_attendance table
ALTER TABLE event_attendance ADD COLUMN calendar_type VARCHAR(20) DEFAULT 'private' 
  CHECK (calendar_type IN ('private', 'shared', 'public'));
ALTER TABLE event_attendance ADD COLUMN notes TEXT;
ALTER TABLE event_attendance ADD COLUMN invited_friends_count INTEGER DEFAULT 0;
ALTER TABLE event_attendance ADD COLUMN last_edited TIMESTAMP DEFAULT NOW();

-- New event invitations table
CREATE TABLE event_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    invitation_type VARCHAR(20) DEFAULT 'friend_invite' CHECK (invitation_type IN ('friend_invite', 'group_invite')),
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    
    UNIQUE(event_id, inviter_id, invitee_id),
    
    -- Indexes for performance
    INDEX idx_invitations_invitee (invitee_id, status, created_at),
    INDEX idx_invitations_event (event_id, status)
);

-- Invitation response tracking
CREATE TABLE invitation_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID NOT NULL REFERENCES event_invitations(id) ON DELETE CASCADE,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('accepted', 'declined', 'maybe')),
    response_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Updated Swipe Model
```python
# Enhanced swipe direction enum
class SwipeDirection(str, Enum):
    RIGHT = "right"  # Going (Private)
    LEFT = "left"    # Not Interested
    UP = "up"        # Going (Share with Friends)
    DOWN = "down"    # Maybe Later

class SwipeAction(str, Enum):
    GOING_PRIVATE = "going_private"
    GOING_SHARED = "going_shared"
    NOT_INTERESTED = "not_interested" 
    MAYBE_LATER = "maybe_later"

# Enhanced swipe creation model
class SwipeCreate(BaseModel):
    event_id: UUID4
    direction: SwipeDirection
    action: SwipeAction
    visibility: str = Field("private", regex="^(private|friends|public)$")
    calendar_type: str = Field("private", regex="^(private|shared|public)$")
    invite_friends: Optional[List[UUID4]] = []
    notes: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = {}
    
    @validator('action')
    def validate_action_direction_match(cls, v, values):
        """Ensure action matches direction"""
        direction_action_map = {
            SwipeDirection.RIGHT: SwipeAction.GOING_PRIVATE,
            SwipeDirection.UP: SwipeAction.GOING_SHARED,
            SwipeDirection.LEFT: SwipeAction.NOT_INTERESTED,
            SwipeDirection.DOWN: SwipeAction.MAYBE_LATER
        }
        expected_action = direction_action_map.get(values.get('direction'))
        if v != expected_action:
            raise ValueError(f'Action {v} does not match direction {values.get("direction")}')
        return v
```

## 3. Backend API Implementation

### New Endpoints

#### Enhanced Swipe Endpoint
```python
@router.post("/swipes", response_model=APIResponse[SwipeWithInvitations])
async def create_swipe(
    swipe_data: SwipeCreate,
    current_user: User = Depends(get_current_user),
    swipe_service: SwipeService = Depends()
):
    """
    Record enhanced swipe with friend invitations
    
    Flow:
    1. Validate swipe data and event exists
    2. Create swipe record
    3. Create/update event_attendance record
    4. Send friend invitations if specified
    5. Update ML preference signals
    6. Send real-time updates to friends
    """
```

#### Calendar Management Endpoints
```python
@router.get("/users/calendar", response_model=PaginatedResponse[CalendarEvent])
async def get_user_calendar(
    calendar_type: Optional[str] = Query(None, regex="^(private|shared|all)$"),
    status: Optional[str] = Query(None, regex="^(going|maybe|saved)$"),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """Get user's calendar events with filtering"""

@router.put("/users/calendar/{event_id}", response_model=APIResponse[CalendarEvent])
async def update_calendar_event(
    event_id: UUID = Path(...),
    updates: CalendarEventUpdate = ...,
    current_user: User = Depends(get_current_user)
):
    """Update calendar event (attendance, visibility, notes)"""

@router.delete("/users/calendar/{event_id}", response_model=APIResponse[None])
async def remove_from_calendar(
    event_id: UUID = Path(...),
    current_user: User = Depends(get_current_user)
):
    """Remove event from calendar completely"""
```

#### Friend Invitation Endpoints
```python
@router.post("/invitations", response_model=APIResponse[List[EventInvitation]])
async def send_event_invitations(
    invitation_data: BulkInvitationCreate,
    current_user: User = Depends(get_current_user)
):
    """Send event invitations to multiple friends"""

@router.put("/invitations/{invitation_id}/respond", response_model=APIResponse[EventInvitation])
async def respond_to_invitation(
    invitation_id: UUID = Path(...),
    response: InvitationResponse = ...,
    current_user: User = Depends(get_current_user)
):
    """Respond to event invitation"""

@router.get("/invitations/received", response_model=PaginatedResponse[EventInvitation])
async def get_received_invitations(
    status: Optional[str] = Query(None, regex="^(pending|accepted|declined|all)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """Get invitations received by user"""
```

## 4. Frontend Implementation

### Enhanced Swipe Component Architecture

#### SwipeCard Component Updates
```typescript
interface SwipeCardProps {
  event: Event;
  onSwipe: (direction: SwipeDirection, options?: SwipeOptions) => void;
  onLongPress: (direction: SwipeDirection) => void;
}

interface SwipeOptions {
  inviteFriends?: string[];
  notes?: string;
  visibility?: 'private' | 'friends' | 'public';
}

// Updated swipe handling
const handleSwipe = async (direction: SwipeDirection, options: SwipeOptions = {}) => {
  const swipeData = {
    event_id: event.id,
    direction,
    action: getActionFromDirection(direction),
    visibility: options.visibility || getDefaultVisibility(direction),
    calendar_type: getCalendarType(direction),
    invite_friends: options.inviteFriends || [],
    notes: options.notes,
    context_data: {
      swipe_speed: swipeMetrics.speed,
      hesitation_time: swipeMetrics.hesitationTime,
      friends_attending: event.friends_attending_count
    }
  };
  
  await swipeEvent.mutateAsync(swipeData);
};
```

#### Long Press Friend Invitation Flow
```typescript
const LongPressFriendInvite: React.FC<{
  event: Event;
  onInvite: (friendIds: string[], message?: string) => void;
  onCancel: () => void;
}> = ({ event, onInvite, onCancel }) => {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [inviteMessage, setInviteMessage] = useState('');
  
  // Friend selection UI with search and filtering
  // Recent event attendees suggested first
  // Mutual friends with other attendees highlighted
};
```

### Calendar Management Interface

#### Calendar Event Editor
```typescript
interface CalendarEventEditorProps {
  event: CalendarEvent;
  onUpdate: (updates: CalendarEventUpdate) => void;
  onRemove: () => void;
}

const CalendarEventEditor: React.FC<CalendarEventEditorProps> = ({
  event,
  onUpdate,
  onRemove
}) => {
  // Segmented control for attendance status
  // Private/Shared toggle
  // Friend invite button with count
  // Notes editor
  // Remove button with confirmation
};
```

#### Calendar Views
```typescript
// Multiple calendar view modes
enum CalendarViewMode {
  LIST = 'list',           // Chronological list
  GRID = 'grid',           // Monthly grid view
  TIMELINE = 'timeline',   // Day/week timeline
  MAP = 'map'             // Map view of events
}

// Calendar filtering options
interface CalendarFilters {
  status: 'going' | 'maybe' | 'all';
  visibility: 'private' | 'shared' | 'all';
  dateRange: { start: Date; end: Date };
  categories: EventCategory[];
  neighborhoods: string[];
}
```

## 5. Real-time Features

### Supabase Realtime Subscriptions

#### Friend Activity Updates
```typescript
// Subscribe to friend invitation updates
const subscribeToInvitations = (userId: string) => {
  return supabase
    .channel(`invitations:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'event_invitations',
      filter: `invitee_id=eq.${userId}`
    }, (payload) => {
      // Handle new invitation
      showInvitationNotification(payload.new);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public', 
      table: 'event_invitations',
      filter: `inviter_id=eq.${userId}`
    }, (payload) => {
      // Handle invitation response
      updateInvitationStatus(payload.new);
    })
    .subscribe();
};
```

#### Event Capacity Updates
```typescript
// Real-time attendance updates
const subscribeToEventUpdates = (eventIds: string[]) => {
  return supabase
    .channel('event_attendance')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'event_attendance',
      filter: `event_id=in.(${eventIds.join(',')})`
    }, (payload) => {
      // Update event attendance counts
      updateEventAttendance(payload.new);
    })
    .subscribe();
};
```

## 6. Notification System

### Push Notification Types

#### Friend Invitations
```typescript
interface InvitationNotification {
  type: 'friend_invitation';
  title: string; // "Sarah invited you to Jazz Night"
  body: string;  // "Tap to respond to the invitation"
  data: {
    invitation_id: string;
    event_id: string;
    inviter_id: string;
    event_title: string;
    event_date: string;
  };
  actions: ['Accept', 'Decline', 'Maybe'];
}
```

#### Invitation Responses
```typescript
interface ResponseNotification {
  type: 'invitation_response';
  title: string; // "Mike accepted your invitation"
  body: string;  // "Mike is going to Jazz Night at Blue Note"
  data: {
    event_id: string;
    responder_id: string;
    response_type: 'accepted' | 'declined' | 'maybe';
  };
}
```

#### Event Reminders
```typescript
interface EventReminderNotification {
  type: 'event_reminder';
  title: string; // "Jazz Night starts in 2 hours"
  body: string;  // "Don't forget about your event tonight"
  data: {
    event_id: string;
    reminder_type: '2_hours' | '30_minutes' | 'starting_now';
  };
}
```

## 7. Machine Learning Enhancements

### Enhanced Feature Extraction
```python
class SwipeFeatureExtractor:
    def extract_features(self, swipe: Swipe, user: User, event: Event) -> Dict[str, float]:
        features = {
            # Basic features
            'user_age': user.age / 50.0,
            'event_category_score': self.get_category_preference(user, event.category),
            'price_match_score': self.calculate_price_match(user, event),
            'distance_score': self.calculate_distance_score(user, event),
            
            # Social features
            'friends_attending_ratio': event.friends_attending / max(user.friends_count, 1),
            'social_proof_score': event.total_right_swipes / max(event.total_swipes, 1),
            'invitation_response_rate': self.get_user_invitation_response_rate(user),
            
            # Temporal features
            'time_preference_match': self.calculate_time_preference(user, event),
            'advance_booking_preference': self.get_advance_booking_preference(user, event),
            
            # Context features
            'swipe_hesitation_time': swipe.context_data.get('hesitation_time', 0) / 10000,
            'swipe_confidence': swipe.confidence_score,
            'calendar_fullness': self.get_calendar_density(user, event.date_time)
        }
        return features
```

### Recommendation Score Adjustment
```python
def adjust_recommendation_for_social_signals(
    base_score: float,
    friends_attending: int,
    user_social_preference: float
) -> float:
    """Boost events where friends are attending based on user's social preference"""
    if friends_attending > 0:
        social_boost = min(0.3, friends_attending * 0.1) * user_social_preference
        return min(1.0, base_score + social_boost)
    return base_score
```

## 8. Implementation Timeline

### Week 1: Enhanced Swipe Models & Database
- [ ] Update database schema with new tables
- [ ] Implement enhanced swipe models in backend
- [ ] Create migration scripts
- [ ] Update existing swipe endpoints
- [ ] Add comprehensive validation

### Week 2: Friend Invitation System
- [ ] Implement invitation creation and management
- [ ] Build invitation response handling
- [ ] Create push notification system
- [ ] Add real-time invitation updates
- [ ] Implement invitation expiration logic

### Week 3: Calendar Management
- [ ] Build calendar CRUD operations
- [ ] Implement calendar editing interface
- [ ] Add calendar filtering and views
- [ ] Create calendar sync functionality
- [ ] Add event reminder system

### Week 4: Frontend Integration
- [ ] Update swipe card component
- [ ] Implement long-press detection
- [ ] Build friend invitation modal
- [ ] Create calendar management UI
- [ ] Add real-time updates to frontend

### Week 5: Polish & Testing
- [ ] Add comprehensive error handling
- [ ] Implement offline support
- [ ] Add analytics tracking
- [ ] Performance optimization
- [ ] End-to-end testing

## 9. Technical Considerations

### Performance Optimizations
- **Batch Invitations**: Send multiple invitations in single API call
- **Calendar Caching**: Cache user calendars with Redis
- **Real-time Throttling**: Limit real-time updates to prevent spam
- **Image Optimization**: Optimize event images for mobile

### Security Considerations
- **Privacy Controls**: Respect user privacy settings for all features
- **Invitation Limits**: Prevent spam invitations (max 10 per event)
- **Rate Limiting**: Limit API calls for invitation endpoints
- **Data Validation**: Validate all user inputs thoroughly

### Scalability Considerations
- **Database Indexing**: Optimize queries with proper indexes
- **Push Notification Batching**: Batch notifications to reduce costs
- **Background Jobs**: Process heavy operations asynchronously
- **CDN Integration**: Use CDN for event images and static assets

## 10. Success Metrics

### User Engagement
- **Swipe Completion Rate**: % of events that receive swipes
- **Calendar Addition Rate**: % of right/up swipes that stay in calendar
- **Friend Invitation Rate**: % of shared events that generate invitations
- **Invitation Response Rate**: % of invitations that receive responses

### Social Features
- **Friend Discovery**: New friendships formed through event invitations
- **Group Formation**: Events that generate group attendance
- **Viral Coefficient**: How many new users come through friend invites

### Technical Performance
- **API Response Time**: <200ms for all endpoints
- **Real-time Latency**: <1 second for real-time updates
- **Push Notification Delivery**: >95% delivery rate
- **App Crash Rate**: <0.1% of sessions

This enhanced swipe system creates a sophisticated yet intuitive event discovery experience that grows with user engagement and builds stronger social connections around shared experiences.
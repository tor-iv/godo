#!/usr/bin/env python3
"""
NYC Events Seed Data Generator for GoDo App

This script generates realistic NYC event data for development and testing.
It creates events across all categories with proper geographic distribution
throughout NYC neighborhoods.

Usage:
    python nyc_events_seed.py --count 500 --days 30
    python nyc_events_seed.py --production  # Seeds production-like data
"""

import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import argparse
from dataclasses import dataclass

import asyncpg
from faker import Faker
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

fake = Faker()

@dataclass
class NYCNeighborhood:
    name: str
    borough: str
    lat: float
    lng: float
    typical_categories: List[str]

# NYC Neighborhoods with real coordinates
NYC_NEIGHBORHOODS = [
    # Manhattan
    NYCNeighborhood("SoHo", "Manhattan", 40.7233, -74.0030, ["culture", "food", "nightlife"]),
    NYCNeighborhood("Greenwich Village", "Manhattan", 40.7335, -74.0027, ["culture", "food", "nightlife"]),
    NYCNeighborhood("East Village", "Manhattan", 40.7264, -73.9818, ["nightlife", "culture", "food"]),
    NYCNeighborhood("Lower East Side", "Manhattan", 40.7153, -73.9874, ["nightlife", "culture", "food"]),
    NYCNeighborhood("Tribeca", "Manhattan", 40.7195, -74.0089, ["food", "culture", "professional"]),
    NYCNeighborhood("Financial District", "Manhattan", 40.7074, -74.0113, ["professional", "networking", "food"]),
    NYCNeighborhood("Midtown", "Manhattan", 40.7549, -73.9840, ["professional", "networking", "culture"]),
    NYCNeighborhood("Upper East Side", "Manhattan", 40.7736, -73.9566, ["culture", "fitness", "food"]),
    NYCNeighborhood("Upper West Side", "Manhattan", 40.7870, -73.9754, ["culture", "fitness", "food"]),
    NYCNeighborhood("Chelsea", "Manhattan", 40.7465, -74.0014, ["food", "culture", "fitness"]),
    NYCNeighborhood("Hell's Kitchen", "Manhattan", 40.7630, -73.9891, ["food", "nightlife", "culture"]),
    NYCNeighborhood("Flatiron", "Manhattan", 40.7411, -73.9897, ["professional", "networking", "food"]),

    # Brooklyn
    NYCNeighborhood("Williamsburg", "Brooklyn", 40.7081, -73.9571, ["culture", "food", "nightlife"]),
    NYCNeighborhood("DUMBO", "Brooklyn", 40.7033, -73.9887, ["culture", "outdoor", "food"]),
    NYCNeighborhood("Park Slope", "Brooklyn", 40.6782, -73.9772, ["food", "culture", "fitness"]),
    NYCNeighborhood("Brooklyn Heights", "Brooklyn", 40.6962, -73.9926, ["culture", "outdoor", "food"]),
    NYCNeighborhood("Red Hook", "Brooklyn", 40.6751, -74.0134, ["food", "culture", "outdoor"]),
    NYCNeighborhood("Bushwick", "Brooklyn", 40.6942, -73.9209, ["culture", "nightlife", "food"]),
    NYCNeighborhood("Crown Heights", "Brooklyn", 40.6677, -73.9444, ["culture", "food", "networking"]),
    NYCNeighborhood("Prospect Heights", "Brooklyn", 40.6776, -73.9682, ["culture", "food", "fitness"]),

    # Queens
    NYCNeighborhood("Long Island City", "Queens", 40.7505, -73.9370, ["culture", "food", "outdoor"]),
    NYCNeighborhood("Astoria", "Queens", 40.7648, -73.9442, ["food", "culture", "nightlife"]),
    NYCNeighborhood("Flushing", "Queens", 40.7677, -73.8330, ["food", "culture", "networking"]),

    # The Bronx
    NYCNeighborhood("South Bronx", "Bronx", 40.8176, -73.9182, ["culture", "networking", "food"]),
    NYCNeighborhood("Fordham", "Bronx", 40.8616, -73.9020, ["culture", "food", "networking"]),

    # Staten Island
    NYCNeighborhood("St. George", "Staten Island", 40.6437, -74.0776, ["outdoor", "culture", "food"])
]

# Event categories and their typical characteristics
EVENT_CATEGORIES = {
    "networking": {
        "titles": [
            "NYC Tech Meetup", "Young Professionals Happy Hour", "Startup Pitch Night",
            "Women in Business Networking", "Finance Professionals Mixer", "Creative Industry Connect",
            "Real Estate Networking Event", "Marketing Professionals Meetup", "Entrepreneurs Breakfast"
        ],
        "venues": [
            "WeWork", "The Wing", "Convene", "Neuehouse", "Bond Collective", "Industrious",
            "The Assemblage", "NeueHouse", "Primary", "Crosby Street Hotel"
        ],
        "price_range": (20, 75),
        "duration_hours": (2, 4),
        "typical_times": ["6:00 PM", "6:30 PM", "7:00 PM", "12:00 PM"]
    },
    "culture": {
        "titles": [
            "Contemporary Art Exhibition", "Independent Film Screening", "Poetry Reading",
            "Gallery Opening", "Museum After Hours", "Theater Performance", "Dance Performance",
            "Book Launch", "Literary Reading", "Jazz Performance"
        ],
        "venues": [
            "MoMA", "Whitney Museum", "Brooklyn Museum", "Met Museum", "Guggenheim",
            "Lincoln Center", "Brooklyn Academy of Music", "Public Theater", "Joyce Theater",
            "Housing Works Bookstore"
        ],
        "price_range": (15, 50),
        "duration_hours": (1.5, 3),
        "typical_times": ["7:00 PM", "7:30 PM", "8:00 PM", "2:00 PM", "3:00 PM"]
    },
    "fitness": {
        "titles": [
            "Morning Yoga in the Park", "Group Running Club", "HIIT Bootcamp", "Rock Climbing Session",
            "Cycling Class", "Pilates Workshop", "Martial Arts Training", "Dance Fitness Class",
            "Outdoor Bootcamp", "Swimming Workshop"
        ],
        "venues": [
            "Central Park", "Bryant Park", "Brooklyn Bridge Park", "Prospect Park",
            "Equinox", "SoulCycle", "Barry's Bootcamp", "ClassPass Studio", "NYC Parks Rec Center",
            "Chelsea Piers"
        ],
        "price_range": (0, 40),
        "duration_hours": (1, 2),
        "typical_times": ["7:00 AM", "8:00 AM", "6:00 PM", "7:00 PM", "12:00 PM"]
    },
    "food": {
        "titles": [
            "Wine Tasting Event", "Cooking Class", "Food Festival", "Brunch Pop-up",
            "Chef's Table Experience", "Coffee Cupping", "Cocktail Making Workshop",
            "Food Tour", "Restaurant Week Event", "Farmers Market"
        ],
        "venues": [
            "Union Square Greenmarket", "Smorgasburg", "Chelsea Market", "Gotham West Market",
            "Brooklyn Flea", "Local Restaurant", "Rooftop Bar", "Wine Bar", "Food Hall",
            "Cooking Studio"
        ],
        "price_range": (25, 150),
        "duration_hours": (1.5, 4),
        "typical_times": ["11:00 AM", "1:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"]
    },
    "nightlife": {
        "titles": [
            "Rooftop Party", "DJ Set", "Live Music Night", "Comedy Show", "Karaoke Night",
            "Club Opening", "Bar Crawl", "Happy Hour Event", "Late Night Dancing",
            "Underground Music Event"
        ],
        "venues": [
            "Output", "House of Yes", "Brooklyn Bowl", "Le Bain", "230 Fifth", "Magic Hour",
            "The Bowery Ballroom", "Mercury Lounge", "Baby's All Right", "Elsewhere"
        ],
        "price_range": (20, 100),
        "duration_hours": (3, 6),
        "typical_times": ["9:00 PM", "10:00 PM", "11:00 PM", "6:00 PM"]
    },
    "outdoor": {
        "titles": [
            "Hiking Group", "Outdoor Movie Screening", "Beach Volleyball", "Kayaking Trip",
            "Picnic in the Park", "Outdoor Yoga", "Running Club", "Cycling Tour",
            "Rock Climbing", "Outdoor Photography Walk"
        ],
        "venues": [
            "Central Park", "Prospect Park", "Bryant Park", "Brooklyn Bridge Park",
            "The High Line", "Governors Island", "Coney Island", "Staten Island Ferry",
            "Hudson River Park", "East River Esplanade"
        ],
        "price_range": (0, 30),
        "duration_hours": (2, 5),
        "typical_times": ["10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "6:00 PM"]
    },
    "professional": {
        "titles": [
            "Industry Conference", "Workshop", "Panel Discussion", "Seminar",
            "Training Session", "Professional Development", "Certification Course",
            "Leadership Workshop", "Skills Training", "Career Fair"
        ],
        "venues": [
            "Javits Center", "Metropolitan Pavilion", "Convene", "WeWork", "NYU", "Columbia",
            "Cornell Tech", "Microsoft Office", "Google NYC", "Facebook NYC"
        ],
        "price_range": (50, 300),
        "duration_hours": (3, 8),
        "typical_times": ["9:00 AM", "10:00 AM", "1:00 PM", "2:00 PM"]
    }
}

# Event sources configuration
EVENT_SOURCES = {
    "eventbrite": {"weight": 0.3, "external_url_pattern": "https://eventbrite.com/e/{}"},
    "meetup": {"weight": 0.25, "external_url_pattern": "https://meetup.com/events/{}"},
    "nyc_cultural": {"weight": 0.15, "external_url_pattern": "https://nyc.gov/events/{}"},
    "nyc_parks": {"weight": 0.1, "external_url_pattern": "https://nycparks.org/events/{}"},
    "facebook_events": {"weight": 0.1, "external_url_pattern": "https://facebook.com/events/{}"},
    "user_generated": {"weight": 0.1, "external_url_pattern": None}
}

class NYCEventsSeeder:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.connection = None

    async def connect(self):
        """Connect to the database"""
        self.connection = await asyncpg.connect(self.db_url)

    async def disconnect(self):
        """Disconnect from the database"""
        if self.connection:
            await self.connection.close()

    def generate_event_data(self, count: int, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """Generate realistic NYC event data"""
        events = []

        for _ in range(count):
            # Choose random category and neighborhood
            category = random.choice(list(EVENT_CATEGORIES.keys()))
            neighborhood = random.choice([n for n in NYC_NEIGHBORHOODS
                                        if category in n.typical_categories])

            # If no neighborhood matches, choose any neighborhood
            if not neighborhood:
                neighborhood = random.choice(NYC_NEIGHBORHOODS)

            category_data = EVENT_CATEGORIES[category]

            # Generate basic event info
            title = random.choice(category_data["titles"])
            venue_name = random.choice(category_data["venues"])

            # Add some variety to titles
            if random.random() < 0.3:
                title = f"{title} - {neighborhood.name}"

            # Generate date/time
            start_date = datetime.now() + timedelta(
                days=random.randint(0, days_ahead),
                hours=random.randint(0, 23)
            )

            # Set appropriate time based on category
            typical_time = random.choice(category_data["typical_times"])
            hour, minute = map(int, typical_time.split(":"))
            start_date = start_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

            # Calculate end time
            duration = random.uniform(*[h * 60 for h in category_data["duration_hours"]])
            end_date = start_date + timedelta(minutes=duration)

            # Generate pricing
            price_min, price_max = category_data["price_range"]
            if random.random() < 0.2:  # 20% free events
                price_min = price_max = 0
            else:
                price_min = random.randint(price_min, price_max - 10) if price_max > price_min + 10 else price_min
                price_max = random.randint(price_min, price_max)

            # Generate capacity
            capacity = random.choice([
                random.randint(10, 30),    # Small events
                random.randint(30, 100),   # Medium events
                random.randint(100, 500),  # Large events
                None                       # No capacity limit
            ])

            # Choose event source
            source = random.choices(
                list(EVENT_SOURCES.keys()),
                weights=[EVENT_SOURCES[s]["weight"] for s in EVENT_SOURCES.keys()]
            )[0]

            # Generate external ID and URL
            external_id = f"{source}_{random.randint(100000, 999999)}"
            external_url = None
            if EVENT_SOURCES[source]["external_url_pattern"]:
                external_url = EVENT_SOURCES[source]["external_url_pattern"].format(external_id)

            # Generate location coordinates with some randomness around neighborhood center
            lat_offset = random.uniform(-0.005, 0.005)
            lng_offset = random.uniform(-0.005, 0.005)
            latitude = neighborhood.lat + lat_offset
            longitude = neighborhood.lng + lng_offset

            # Generate address
            address = f"{random.randint(1, 999)} {fake.street_name()}, {neighborhood.name}, {neighborhood.borough}, NY"

            # Generate description
            descriptions = [
                f"Join us for an amazing {category} experience in {neighborhood.name}!",
                f"Don't miss this exciting {category} event featuring local talent.",
                f"Experience the best of {neighborhood.name}'s {category} scene.",
                f"A unique {category} experience you won't want to miss.",
                f"Connect with like-minded people at this {category} gathering."
            ]
            description = random.choice(descriptions)

            # Add more detail to description
            if random.random() < 0.7:
                details = [
                    f"Located in the heart of {neighborhood.name}.",
                    f"Perfect for {category} enthusiasts.",
                    f"Featuring local NYC talent.",
                    f"Food and drinks available.",
                    f"All skill levels welcome.",
                    f"Registration required."
                ]
                description += " " + random.choice(details)

            # Generate tags
            category_tags = {
                "networking": ["professional", "business", "careers", "startup", "entrepreneur"],
                "culture": ["art", "music", "theater", "exhibition", "performance"],
                "fitness": ["health", "wellness", "workout", "sports", "active"],
                "food": ["dining", "cooking", "wine", "restaurant", "culinary"],
                "nightlife": ["party", "music", "dancing", "drinks", "entertainment"],
                "outdoor": ["nature", "adventure", "sports", "hiking", "recreation"],
                "professional": ["conference", "training", "education", "workshop", "seminar"]
            }

            tags = random.sample(category_tags[category], random.randint(2, 4))
            tags.append(neighborhood.name.lower().replace(" ", "_"))
            tags.append(neighborhood.borough.lower())

            # Generate accessibility info
            accessibility_features = ["wheelchair_accessible", "hearing_loop", "sign_language", "large_print"]
            accessibility_info = {}
            if random.random() < 0.4:  # 40% of events have accessibility info
                accessibility_info = {
                    feature: random.choice([True, False])
                    for feature in random.sample(accessibility_features, random.randint(1, 2))
                }

            # Generate metadata
            metadata = {
                "weather_dependent": category == "outdoor",
                "age_restriction": random.choice([None, 18, 21]) if category in ["nightlife"] else None,
                "dress_code": random.choice([None, "casual", "business casual", "formal"]) if random.random() < 0.2 else None,
                "parking_available": random.choice([True, False]),
                "public_transit_nearby": True,  # Most NYC events are transit accessible
            }

            # Calculate transit score (1-10, higher is better)
            # NYC events generally have good transit access
            transit_score = random.randint(6, 10)

            # Generate image URL (placeholder)
            image_url = f"https://picsum.photos/400/300?random={random.randint(1, 1000)}"

            # Determine if featured (5% chance)
            is_featured = random.random() < 0.05

            event = {
                "id": str(uuid.uuid4()),
                "title": title,
                "description": description,
                "date_time": start_date.isoformat(),
                "end_time": end_date.isoformat(),
                "location_name": venue_name,
                "location_address": address,
                "latitude": latitude,
                "longitude": longitude,
                "neighborhood": neighborhood.name,
                "category": category,
                "source": source,
                "external_id": external_id,
                "external_url": external_url,
                "image_url": image_url,
                "price_min": price_min,
                "price_max": price_max,
                "capacity": capacity,
                "current_attendees": random.randint(0, min(capacity or 50, 50)) if capacity else random.randint(0, 50),
                "is_active": True,
                "is_featured": is_featured,
                "is_user_generated": source == "user_generated",
                "created_by_user_id": None,  # Will be set for user_generated events
                "moderation_status": "approved",
                "accessibility_info": json.dumps(accessibility_info),
                "transit_score": transit_score,
                "metadata": json.dumps(metadata),
                "tags": tags,
                "popularity_score": random.uniform(0.1, 0.9),
                "friend_attendance_count": random.randint(0, 5),
                "similar_user_attendance": random.randint(0, 10)
            }

            events.append(event)

        return events

    async def seed_events(self, events: List[Dict[str, Any]]):
        """Insert events into the database"""
        if not self.connection:
            raise Exception("Database connection not established")

        # Prepare the SQL query
        query = """
        INSERT INTO events (
            id, title, description, date_time, end_time, location_name, location_address,
            location_point, neighborhood, category, source, external_id, external_url,
            image_url, price_min, price_max, capacity, current_attendees, is_active,
            is_featured, is_user_generated, moderation_status, accessibility_info,
            transit_score, metadata, tags, popularity_score, friend_attendance_count,
            similar_user_attendance
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326),
            $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
            $24, $25, $26, $27, $28, $29, $30
        )
        """

        for event in events:
            try:
                await self.connection.execute(
                    query,
                    event["id"],
                    event["title"],
                    event["description"],
                    datetime.fromisoformat(event["date_time"]),
                    datetime.fromisoformat(event["end_time"]),
                    event["location_name"],
                    event["location_address"],
                    event["longitude"],  # Note: PostGIS uses lng, lat order
                    event["latitude"],
                    event["neighborhood"],
                    event["category"],
                    event["source"],
                    event["external_id"],
                    event["external_url"],
                    event["image_url"],
                    event["price_min"],
                    event["price_max"],
                    event["capacity"],
                    event["current_attendees"],
                    event["is_active"],
                    event["is_featured"],
                    event["is_user_generated"],
                    event["moderation_status"],
                    event["accessibility_info"],
                    event["transit_score"],
                    event["metadata"],
                    event["tags"],
                    event["popularity_score"],
                    event["friend_attendance_count"],
                    event["similar_user_attendance"]
                )
            except Exception as e:
                print(f"Error inserting event {event['title']}: {e}")
                continue

        print(f"Successfully seeded {len(events)} events")

    async def seed_test_users(self, count: int = 10):
        """Create test users for development"""
        if not self.connection:
            raise Exception("Database connection not established")

        users = []
        for i in range(count):
            user_id = str(uuid.uuid4())
            email = f"testuser{i+1}@godo.app"
            full_name = fake.name()
            age = random.randint(22, 35)
            neighborhood = random.choice(NYC_NEIGHBORHOODS)
            privacy_level = random.choice(["private", "friends_only", "public"])

            # Generate preferences
            preferences = {
                "categories": random.sample(list(EVENT_CATEGORIES.keys()), random.randint(2, 4)),
                "neighborhoods": random.sample([n.name for n in NYC_NEIGHBORHOODS], random.randint(2, 5)),
                "price_sensitivity": random.uniform(0.2, 0.8),
                "social_preference": random.uniform(0.3, 0.9)
            }

            users.append({
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "age": age,
                "location_neighborhood": neighborhood.name,
                "privacy_level": privacy_level,
                "preferences": json.dumps(preferences),
                "is_active": True
            })

        # Note: In production, users are created through Supabase Auth
        # This is just for development testing
        query = """
        INSERT INTO users (
            id, email, full_name, age, location_neighborhood, privacy_level,
            preferences, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
        """

        for user in users:
            try:
                await self.connection.execute(
                    query,
                    user["id"],
                    user["email"],
                    user["full_name"],
                    user["age"],
                    user["location_neighborhood"],
                    user["privacy_level"],
                    user["preferences"],
                    user["is_active"]
                )
            except Exception as e:
                print(f"Error inserting user {user['email']}: {e}")
                continue

        print(f"Successfully created {len(users)} test users")
        return users

async def main():
    parser = argparse.ArgumentParser(description="Seed NYC events data")
    parser.add_argument("--count", type=int, default=200, help="Number of events to generate")
    parser.add_argument("--days", type=int, default=30, help="Number of days ahead to generate events")
    parser.add_argument("--users", type=int, default=10, help="Number of test users to create")
    parser.add_argument("--production", action="store_true", help="Generate production-like data (1000 events, 60 days)")
    parser.add_argument("--db-url", type=str, help="Database URL (overrides environment)")

    args = parser.parse_args()

    if args.production:
        args.count = 1000
        args.days = 60
        args.users = 50

    # Get database URL
    db_url = args.db_url or os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL environment variable or --db-url argument required")
        return

    # Create seeder instance
    seeder = NYCEventsSeeder(db_url)

    try:
        await seeder.connect()
        print(f"Connected to database")

        # Generate and seed events
        print(f"Generating {args.count} events for next {args.days} days...")
        events = seeder.generate_event_data(args.count, args.days)

        print("Seeding events...")
        await seeder.seed_events(events)

        # Create test users if requested
        if args.users > 0:
            print(f"Creating {args.users} test users...")
            await seeder.seed_test_users(args.users)

        print("✅ Database seeding completed successfully!")

        # Print summary
        print(f"\nSummary:")
        print(f"- {len(events)} events created")
        print(f"- {args.users} test users created")
        print(f"- Events span {args.days} days")
        print(f"- Categories: {', '.join(EVENT_CATEGORIES.keys())}")
        print(f"- Neighborhoods: {len(NYC_NEIGHBORHOODS)} NYC neighborhoods")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await seeder.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
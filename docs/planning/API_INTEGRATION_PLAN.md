# Event API Integration Plan

## Overview
Add comprehensive event data integration to pull from multiple APIs (Resy, OpenTable, Eventbrite, Partiful, gov sites) and unify them into the existing Event data model.

## Current State Analysis
- Basic Event interface with core properties (title, date, location, category, price, etc.)
- Mock data implementation with 8 sample events
- React Native with TypeScript, TanStack Query for data fetching
- Existing categories: networking, culture, fitness, food, nightlife, outdoor, professional

## Implementation Plan

### 1. Data Layer Enhancements
- **Event Source Tracking**: Extend Event interface to include `source`, `externalId`, `lastUpdated`, `sourceUrl`
- **API Adapter Interface**: Create base adapter interface for consistent data transformation
- **Event Enrichment**: Add fields for external booking URLs, attendee social features, venue details

### 2. API Integration Architecture
- **Services Layer**: Create individual service classes for each API (ResyService, EventbriteService, etc.)
- **Data Transformation**: Build adapters to convert external API data to internal Event format
- **Caching Strategy**: Implement intelligent caching with React Query for different update frequencies
- **Error Handling**: Robust error handling with fallbacks and retry logic

### 3. API-Specific Implementations
- **Resy/OpenTable**: Restaurant events, dining experiences, special menus
- **Eventbrite**: Wide variety of events with comprehensive metadata
- **Partiful**: Social/party events popular with young professionals
- **Government APIs**: Cultural events, parks & recreation, free activities
- **Custom APIs**: NYC-specific event sources, venue partnerships

### 4. Event Discovery & Curation
- **Location-Based Filtering**: NYC-specific geofencing and neighborhood mapping
- **Smart Categorization**: AI-powered category assignment from external event descriptions
- **Deduplication Logic**: Identify and merge duplicate events from multiple sources
- **Quality Scoring**: Rate events based on completeness, popularity, and relevance

### 5. Background Sync & Updates
- **Scheduled Fetching**: Background jobs to regularly sync new events
- **Real-time Updates**: Push notifications for last-minute event changes
- **Batch Processing**: Efficient bulk import and update operations
- **API Rate Limiting**: Respect rate limits with intelligent request scheduling

### 6. Enhanced User Experience
- **Source Attribution**: Show users where events come from
- **Deep Linking**: Direct links to external booking/registration
- **Availability Status**: Real-time capacity and ticket availability
- **Social Integration**: Import events from connected social accounts

## Technical Implementation Order:
1. ✅ Create API Integration Plan document
2. Extend data models and create API service architecture
3. Implement first API integration (Eventbrite - most comprehensive)
4. Add data transformation and caching layers
5. Build additional API integrations (Resy, government APIs)
6. Implement deduplication and quality scoring
7. Add background sync and real-time updates
8. Enhanced UI for multi-source events

## API Sources & Endpoints

### Eventbrite API
- **Base URL**: `https://www.eventbriteapi.com/v3/`
- **Key Endpoints**: 
  - `/events/search/` - Search events by location, date, category
  - `/events/{id}/` - Get event details
  - `/venues/{id}/` - Get venue information
- **Rate Limits**: 1000 requests per hour per private token
- **Data Quality**: High - comprehensive event metadata

### NYC Open Data APIs
- **NYC Parks Events**: `https://data.cityofnewyork.us/resource/8end-qv57.json`
- **Cultural Events**: `https://data.cityofnewyork.us/resource/tvpp-9vvx.json`
- **Rate Limits**: No authentication required, reasonable usage expected
- **Data Quality**: Medium - government curated but basic metadata

### Resy API (Unofficial)
- **Base URL**: Research needed - likely web scraping approach
- **Focus**: Restaurant events, chef's table experiences, wine tastings
- **Rate Limits**: TBD - need to implement respectful scraping
- **Data Quality**: High for food events

### Partiful API
- **Status**: Need to investigate availability of public API
- **Alternative**: Social media integration or web scraping
- **Focus**: Party and social events popular with young professionals

This approach maintains the existing swipe-based UX while dramatically expanding event variety and freshness through multiple data sources.
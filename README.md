# NetWood API

A RESTful API for fetching and categorizing Nigerian movies and TV shows using the YouTube API.

## Overview

NetWood API provides a comprehensive solution for accessing Nigerian film content. It fetches data from YouTube, categorizes it intelligently, and stores it in a MongoDB database to reduce API calls and improve performance.

### Key Features

- **Content Categorization**: Automatically categorizes content by type (movie/TV show), genre, language, and more
- **Smart Search**: Search by movie titles, actor names, and other metadata
- **Fallback Search**: If content isn't found in the database, it automatically searches YouTube
- **Minimum Result Guarantee**: All genre category pages return a minimum of 12 results, automatically supplementing with YouTube content if needed
- **Daily Updates**: Cron job runs every 24 hours to keep the database fresh
- **Comprehensive Filtering**: Filter content by multiple criteria including genre, language, cast, and more
- **High-Quality Thumbnails**: Provides thumbnails in multiple resolutions (default, medium, high, standard, maxres)

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: MongoDB object modeling
- **YouTube API**: Data source
- **Node-cron**: Scheduled tasks
- **Winston**: Logging
- **Helmet**: Security
- **Express Rate Limit**: API protection

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- YouTube API key

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/NetWood-api.git
   cd NetWood-api
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/NetWood
   NODE_ENV=development
   YOUTUBE_API_KEY=your_youtube_api_key
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   ```

4. Start the server:

   ```
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### Database Seeding

The API will automatically check if the database is empty on startup and seed it with a small amount of initial data. For more comprehensive seeding, you can:

1. Run the general seed script:

   ```
   npm run seed
   ```

   This will populate the database with content from various Nigerian movie and TV show categories.

2. Run the genre-specific seed script:

   ```
   npm run seed-genres
   ```

   This ensures each genre has at least 15 items and is particularly useful for improving genre-based category pages.

3. Use the manual seeding endpoints:

   ```
   # General content seeding
   POST /api/content/seed

   {
     "query": "Nigerian comedy movies",
     "limit": 20
   }
   ```

   ```
   # Genre-specific seeding
   POST /api/content/seed/genres

   {
     "resultsPerGenre": 15
   }
   ```

   These allow you to seed the database with specific content based on your query or ensure minimum content for all genres.

## API Endpoints

### Search Content

```
GET /api/content/search
```

Query Parameters:

- `query`: Search term
- `limit`: Number of results to return (default: 20)
- `page`: Page number for pagination (default: 1)

### Get Trending Content

```
GET /api/content/trending
```

Query Parameters:

- `limit`: Number of results to return (default: 20)
- `page`: Page number for pagination (default: 1)

### Get Trending Movies

```
GET /api/content/trending/movies
```

Query Parameters:

- `limit`: Number of results to return (default: 20)
- `page`: Page number for pagination (default: 1)

### Get Trending TV Shows

```
GET /api/content/trending/tvshows
```

Query Parameters:

- `limit`: Number of results to return (default: 20)
- `page`: Page number for pagination (default: 1)

```

```

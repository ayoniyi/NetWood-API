# NetWood API Documentation

This document provides comprehensive documentation for the NetWood API, which serves Nigerian movies and TV shows data fetched from YouTube.

## Base URL

```
http://localhost:3000/api
```

Replace `localhost:3000` with your actual domain in production.

## Authentication

Currently, the API uses rate limiting for protection but does not require authentication. Rate limits are set to 100 requests per 15-minute window by default.

## Response Format

All API responses follow a consistent JSON format:

### Success Response

```json
{
  "success": true,
  "count": 10,
  "page": 1,
  "pages": 5,
  "totalCount": 48,
  "data": [...]
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## API Endpoints

### 1. Search Content

Search for Nigerian movies and TV shows based on various criteria.

```
GET /content/search
```

#### Query Parameters

| Parameter         | Type   | Description                                                                          | Required |
| ----------------- | ------ | ------------------------------------------------------------------------------------ | -------- |
| keyword           | string | Search term (movie title, actor name, etc.)                                          | No       |
| contentType       | string | Filter by content type (movie, tvshow). If not provided, searches all content types. | No       |
| genre             | string | Filter by genre                                                                      | No       |
| language          | string | Filter by language. If not provided, searches all languages.                         | No       |
| cast              | string | Filter by cast member                                                                | No       |
| director          | string | Filter by director                                                                   | No       |
| productionCompany | string | Filter by production company                                                         | No       |
| popularityTier    | string | Filter by popularity tier (viral, popular, moderate, niche)                          | No       |
| releaseYear       | number | Filter by release year                                                               | No       |
| limit             | number | Number of results to return (default: 20)                                            | No       |
| page              | number | Page number for pagination (default: 1)                                              | No       |

#### Example Requests

Search across all content types and languages:

```
GET /content/search?keyword=love
```

Filter by specific content type and language:

```
GET /content/search?keyword=love&contentType=movie&language=English&limit=10&page=1
```

#### Example Response

```json
{
  "success": true,
  "count": 10,
  "page": 1,
  "pages": 3,
  "totalCount": 27,
  "data": [
    {
      "_id": "60f7b0b3e6b3a1234567890a",
      "videoId": "abcdefghijk",
      "title": "Love in Lagos",
      "description": "A romantic comedy set in Lagos...",
      "publishedAt": "2023-01-15T12:00:00.000Z",
      "thumbnails": {
        "default": {
          "url": "https://i.ytimg.com/vi/abcdefghijk/default.jpg",
          "width": 120,
          "height": 90
        },
        "medium": {
          "url": "https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg",
          "width": 320,
          "height": 180
        },
        "high": {
          "url": "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
          "width": 480,
          "height": 360
        },
        "standard": {
          "url": "https://i.ytimg.com/vi/abcdefghijk/sddefault.jpg",
          "width": 640,
          "height": 480
        },
        "maxres": {
          "url": "https://i.ytimg.com/vi/abcdefghijk/maxresdefault.jpg",
          "width": 1280,
          "height": 720
        }
      },
      "channelId": "UC1234567890abcdefg",
      "channelTitle": "Nollywood Channel",
      "contentType": "movie",
      "genre": ["romance", "comedy"],
      "language": "English",
      "cast": ["John Doe", "Jane Smith"],
      "director": "Famous Director",
      "viewCount": 500000,
      "likeCount": 25000,
      "commentCount": 3000,
      "popularityTier": "popular",
      "releaseYear": 2023
    }
    // More results...
  ],
  "source": "database"
}
```

### 2. Get Content by Category

Retrieve content filtered by a specific category type and value. For genre categories, the API ensures a minimum of 12 results by supplementing database results with YouTube content when necessary.

```
GET /content/category/:categoryType/:categoryValue
```

#### Path Parameters

| Parameter     | Type   | Description           | Required |
| ------------- | ------ | --------------------- | -------- |
| categoryType  | string | Type of category      | Yes      |
| categoryValue | string | Value of the category | Yes      |

Valid category types:

- contentType
- genre
- language
- series
- director
- cast
- productionCompany
- popularityTier
- releaseYear
- seasonal

#### Query Parameters

| Parameter | Type   | Description                               | Required |
| --------- | ------ | ----------------------------------------- | -------- |
| limit     | number | Number of results to return (default: 20) | No       |
| page      | number | Page number for pagination (default: 1)   | No       |

#### Example Request

```
GET /content/category/genre/comedy?limit=10&page=1
```

#### Example Response

```json
{
  "success": true,
  "count": 12,
  "page": 1,
  "pages": 5,
  "totalCount": 45,
  "data": [
    {
      "_id": "60f7b0b3e6b3a1234567890b",
      "videoId": "lmnopqrstuv",
      "title": "Lagos Laughs",
      "description": "A hilarious comedy set in Lagos...",
      "publishedAt": "2023-02-20T14:30:00.000Z",
      "thumbnails": {
        "default": {
          "url": "https://i.ytimg.com/vi/lmnopqrstuv/default.jpg",
          "width": 120,
          "height": 90
        },
        "medium": {
          "url": "https://i.ytimg.com/vi/lmnopqrstuv/mqdefault.jpg",
          "width": 320,
          "height": 180
        },
        "high": {
          "url": "https://i.ytimg.com/vi/lmnopqrstuv/hqdefault.jpg",
          "width": 480,
          "height": 360
        }
      },
      "channelId": "UC0987654321zyxwvuts",
      "channelTitle": "Comedy Central Nigeria",
      "contentType": "movie",
      "genre": ["comedy"],
      "language": "English",
      "cast": ["Comedian A", "Comedian B"],
      "director": "Comedy Director",
      "viewCount": 750000,
      "likeCount": 40000,
      "commentCount": 5000,
      "popularityTier": "popular",
      "releaseYear": 2023
    }
    // More results...
  ],
  "source": "database"
}
```

**Note**: When there are fewer than 12 items for a genre category in the database, the API automatically fetches additional results from YouTube to ensure a minimum of 12 results. In such cases, the response will include a `source` field with the value `database+youtube`.

### 3. Get Trending Content

Retrieve trending content based on recent uploads and view counts.

```
GET /content/trending
```

#### Query Parameters

| Parameter | Type   | Description                               | Required |
| --------- | ------ | ----------------------------------------- | -------- |
| limit     | number | Number of results to return (default: 20) | No       |
| page      | number | Page number for pagination (default: 1)   | No       |

#### Example Request

```
GET /content/trending?limit=5
```

#### Example Response

```json
{
  "success": true,
  "count": 5,
  "page": 1,
  "pages": 3,
  "totalCount": 27,
  "data": [
    {
      "_id": "60f7b0b3e6b3a1234567890c",
      "videoId": "wxyzabcdefg",
      "title": "New Blockbuster Movie",
      "description": "The latest hit movie from Nigeria...",
      "publishedAt": "2023-07-01T10:00:00.000Z",
      "thumbnails": {
        "default": {
          "url": "https://i.ytimg.com/vi/wxyzabcdefg/default.jpg",
          "width": 120,
          "height": 90
        },
        "medium": {
          "url": "https://i.ytimg.com/vi/wxyzabcdefg/mqdefault.jpg",
          "width": 320,
          "height": 180
        },
        "high": {
          "url": "https://i.ytimg.com/vi/wxyzabcdefg/hqdefault.jpg",
          "width": 480,
          "height": 360
        }
      },
      "channelId": "UC1122334455aabbcc",
      "channelTitle": "Trending Nollywood",
      "contentType": "movie",
      "genre": ["action", "drama"],
      "language": "English",
      "cast": ["Star Actor", "Star Actress"],
      "director": "Famous Director",
      "viewCount": 2000000,
      "likeCount": 150000,
      "commentCount": 20000,
      "popularityTier": "viral",
      "releaseYear": 2023
    }
    // More results...
  ]
}
```

### 3.1 Get Trending Movies

Retrieve trending movies based on recent uploads and view counts.

```
GET /content/trending/movies
```

#### Query Parameters

| Parameter | Type   | Description                               | Required |
| --------- | ------ | ----------------------------------------- | -------- |
| limit     | number | Number of results to return (default: 20) | No       |
| page      | number | Page number for pagination (default: 1)   | No       |

#### Example Request

```
GET /content/trending/movies?limit=5
```

#### Example Response

Similar to the general trending endpoint but only includes content where `contentType` is "movie".

### 3.2 Get Trending TV Shows

Retrieve trending TV shows based on recent uploads and view counts.

```
GET /content/trending/tvshows
```

#### Query Parameters

| Parameter | Type   | Description                               | Required |
| --------- | ------ | ----------------------------------------- | -------- |
| limit     | number | Number of results to return (default: 20) | No       |
| page      | number | Page number for pagination (default: 1)   | No       |

#### Example Request

```
GET /content/trending/tvshows?limit=5
```

#### Example Response

Similar to the general trending endpoint but only includes content where `contentType` is "tvshow".

### 4. Get All Categories

Retrieve counts of all available categories in the database.

```
GET /content/categories
```

#### Example Request

```
GET /content/categories
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "contentTypes": [
      { "_id": "movie", "count": 150 },
      { "_id": "tvshow", "count": 75 }
    ],
    "genres": [
      { "_id": "comedy", "count": 80 },
      { "_id": "drama", "count": 70 },
      { "_id": "action", "count": 50 },
      { "_id": "romance", "count": 40 },
      { "_id": "thriller", "count": 30 }
    ],
    "languages": [
      { "_id": "English", "count": 120 },
      { "_id": "Yoruba", "count": 50 },
      { "_id": "Igbo", "count": 30 },
      { "_id": "Hausa", "count": 20 },
      { "_id": "Pidgin", "count": 15 }
    ],
    "productionCompanies": [
      { "_id": "Company A", "count": 25 },
      { "_id": "Company B", "count": 20 }
      // More production companies...
    ],
    "directors": [
      { "_id": "Director X", "count": 15 },
      { "_id": "Director Y", "count": 12 }
      // More directors...
    ],
    "cast": [
      { "_id": "Actor A", "count": 30 },
      { "_id": "Actor B", "count": 25 }
      // More cast members...
    ],
    "releaseYears": [
      { "_id": 2023, "count": 50 },
      { "_id": 2022, "count": 75 },
      { "_id": 2021, "count": 60 }
      // More years...
    ]
  }
}
```

### 5. Seed Database

Manually seed the database with content from YouTube.

```
POST /content/seed
```

#### Request Body

| Parameter | Type   | Description                                           | Required |
| --------- | ------ | ----------------------------------------------------- | -------- |
| query     | string | Search query for YouTube (default: "Nigerian movies") | No       |
| limit     | number | Number of results to fetch (default: 20)              | No       |

#### Example Request

```
POST /content/seed

{
  "query": "Nigerian comedy movies",
  "limit": 20
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Successfully seeded database with 18 items",
  "count": 18
}
```

## Data Model

The Content model includes the following fields:

| Field             | Type   | Description                                                                         |
| ----------------- | ------ | ----------------------------------------------------------------------------------- |
| videoId           | String | YouTube video ID (unique)                                                           |
| title             | String | Video title                                                                         |
| description       | String | Video description                                                                   |
| publishedAt       | Date   | Publication date                                                                    |
| thumbnails        | Object | Video thumbnail images in various formats (default, medium, high, standard, maxres) |
| channelId         | String | YouTube channel ID                                                                  |
| channelTitle      | String | YouTube channel title                                                               |
| contentType       | String | Type of content (movie, tvshow)                                                     |
| genre             | Array  | Array of genres                                                                     |
| series            | String | Series name (if part of a series)                                                   |
| part              | Number | Part number (if part of a series)                                                   |
| language          | String | Primary language                                                                    |
| productionCompany | String | Production company name                                                             |
| director          | String | Director name                                                                       |
| cast              | Array  | Array of cast members                                                               |
| viewCount         | Number | Number of views                                                                     |
| likeCount         | Number | Number of likes                                                                     |
| commentCount      | Number | Number of comments                                                                  |
| popularityTier    | String | Popularity tier (viral, popular, moderate, niche)                                   |
| releaseYear       | Number | Year of release                                                                     |
| seasonal          | String | Seasonal category (Christmas, Easter, etc.)                                         |
| lastUpdated       | Date   | Last update timestamp                                                               |

### Thumbnail Formats

The API provides thumbnails in multiple resolutions:

| Format   | Resolution (approx.) | Description                                 |
| -------- | -------------------- | ------------------------------------------- |
| default  | 120x90               | Default thumbnail (lowest resolution)       |
| medium   | 320x180              | Medium resolution thumbnail                 |
| high     | 480x360              | High resolution thumbnail                   |
| standard | 640x480              | Standard resolution thumbnail               |
| maxres   | 1280x720             | Maximum resolution thumbnail (if available) |

Note: Not all videos will have all thumbnail formats available. The API will return `null` for unavailable formats.

## Error Codes

| Status Code | Description                                          |
| ----------- | ---------------------------------------------------- |
| 200         | OK - Request succeeded                               |
| 400         | Bad Request - Invalid parameters or validation error |
| 404         | Not Found - Resource not found                       |
| 429         | Too Many Requests - Rate limit exceeded              |
| 500         | Internal Server Error - Server error                 |

## Rate Limiting

The API implements rate limiting to prevent abuse. By default, clients are limited to 100 requests per 15-minute window. When the rate limit is exceeded, the API will respond with a 429 status code.

Rate limit headers are included in the response:

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1626307512
```

## Pagination

For endpoints that return multiple results, pagination is implemented using the `limit` and `page` query parameters:

- `limit`: Number of results per page (default: 20, max: 100)
- `page`: Page number (default: 1)

The response includes comprehensive pagination metadata:

- `count`: Number of results in the current page
- `page`: Current page number
- `pages`: Total number of pages
- `totalCount`: Total number of matching results across all pages

This enables clients to implement pagination controls more effectively, showing users how many total results are available and how many pages they can navigate through.

## Database Seeding

The API provides multiple ways to seed the database with content:

1. **Automatic Seeding**: The server automatically checks if the database is empty on startup and seeds it with a small amount of initial data.

2. **Manual Seeding Script**: Run `npm run seed` to populate the database with content from various Nigerian movie and TV show categories.

3. **General Seeding API Endpoint**: Use the `/content/seed` endpoint to manually seed the database with specific content based on your query.

4. **Genre-Specific Seeding**: Use the `/content/seed/genres` endpoint to ensure each genre has a minimum number of items available:

```
POST /content/seed/genres
```

#### Request Body

| Parameter       | Type   | Description                                      | Required |
| --------------- | ------ | ------------------------------------------------ | -------- |
| resultsPerGenre | number | Target number of results per genre (default: 15) | No       |

#### Example Request

```json
{
  "resultsPerGenre": 20
}
```

#### Example Response

```json
{
  "success": true,
  "message": "Successfully seeded genres with target of 20 items per genre",
  "results": {
    "romance": { "existing": 8, "added": 12, "total": 20 },
    "action": { "existing": 15, "added": 5, "total": 20 },
    "comedy": { "existing": 5, "added": 15, "total": 20 },
    "drama": { "existing": 10, "added": 10, "total": 20 },
    "thriller": { "existing": 3, "added": 17, "total": 20 },
    "horror": { "existing": 2, "added": 18, "total": 20 }
  }
}
```

This endpoint ensures that each genre defined in the system has at least the specified number of content items available, making genre-based category pages more useful.

## Best Practices

1. **Use specific search terms**: When searching, use specific keywords for better results.
2. **Implement caching**: Cache API responses on your client to reduce the number of requests.
3. **Handle rate limiting**: Implement exponential backoff when rate limits are hit.
4. **Use pagination**: Always use pagination for endpoints that return multiple results.
5. **Error handling**: Properly handle error responses in your client application.
6. **Seed the database**: Make sure to seed the database before using the API to ensure endpoints return data.

## Examples

### Searching for a Movie by Title

```javascript
fetch("http://localhost:3000/api/content/search?keyword=love%20in%20lagos")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

### Filtering Movies by Genre

```javascript
fetch("http://localhost:3000/api/content/category/genre/comedy")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

### Getting Trending Content

```javascript
fetch("http://localhost:3000/api/content/trending?limit=10")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

### Seeding the Database

```javascript
fetch("http://localhost:3000/api/content/seed", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: "Nigerian comedy movies",
    limit: 20,
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

## Support

For issues, questions, or feature requests, please contact the API maintainers or open an issue on the GitHub repository.

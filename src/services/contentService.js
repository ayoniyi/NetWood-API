const { searchYouTube, getVideoDetails } = require("../config/youtube");
const Content = require("../models/Content");
const { categorizeContent, genreKeywords } = require("../utils/categorizer");
const logger = require("../config/logger");

/**
 * Extract all available thumbnails from video data
 * @param {Object} thumbnails - Thumbnails object from YouTube API
 * @returns {Object} - Formatted thumbnails object with all available formats
 */
const extractThumbnails = (thumbnails) => {
  const result = {
    default: thumbnails.default || null,
    medium: thumbnails.medium || null,
    high: thumbnails.high || null,
    standard: thumbnails.standard || null,
    maxres: thumbnails.maxres || null,
  };

  return result;
};

/**
 * Fetch content from YouTube API and save to database
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results to fetch
 * @returns {Promise<Array>} - Array of saved content
 */
const fetchAndSaveContent = async (query, maxResults = 50) => {
  try {
    logger.info(`Fetching content from YouTube API with query: ${query}`);

    // Search YouTube for content
    const searchResults = await searchYouTube(query, maxResults);

    if (!searchResults.items || searchResults.items.length === 0) {
      logger.warn(`No results found for query: ${query}`);
      return [];
    }

    // Get video IDs from search results
    const videoIds = searchResults.items.map((item) => item.id.videoId);

    // Get detailed video information
    const videoDetails = await getVideoDetails(videoIds);

    if (!videoDetails.items || videoDetails.items.length === 0) {
      logger.warn(`No video details found for query: ${query}`);
      return [];
    }

    // Process and save each video
    const savedContent = [];

    for (const video of videoDetails.items) {
      // Check if video already exists in database
      const existingContent = await Content.findOne({ videoId: video.id });

      if (existingContent) {
        // Update existing content with new data
        const categorizedData = categorizeContent(video);

        // Update view counts and other metrics
        existingContent.viewCount = parseInt(video.statistics.viewCount) || 0;
        existingContent.likeCount = parseInt(video.statistics.likeCount) || 0;
        existingContent.commentCount =
          parseInt(video.statistics.commentCount) || 0;
        existingContent.lastUpdated = new Date();

        // Update thumbnails to include all available formats
        if (video.snippet && video.snippet.thumbnails) {
          existingContent.thumbnails = extractThumbnails(
            video.snippet.thumbnails
          );
        }

        // Save updated content
        await existingContent.save();
        savedContent.push(existingContent);

        logger.debug(`Updated existing content: ${video.snippet.title}`);
      } else {
        // Create new content
        const categorizedData = categorizeContent(video);

        // Extract all available thumbnail formats
        const thumbnails =
          video.snippet && video.snippet.thumbnails
            ? extractThumbnails(video.snippet.thumbnails)
            : {
                default: null,
                medium: null,
                high: null,
                standard: null,
                maxres: null,
              };

        const newContent = new Content({
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          publishedAt: new Date(video.snippet.publishedAt),
          thumbnails,
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          viewCount: parseInt(video.statistics.viewCount) || 0,
          likeCount: parseInt(video.statistics.likeCount) || 0,
          commentCount: parseInt(video.statistics.commentCount) || 0,
          ...categorizedData,
        });

        // Save new content
        await newContent.save();
        savedContent.push(newContent);

        logger.debug(`Saved new content: ${video.snippet.title}`);
      }
    }

    logger.info(
      `Successfully processed ${savedContent.length} videos for query: ${query}`
    );
    return savedContent;
  } catch (error) {
    logger.error(`Error fetching and saving content: ${error.message}`);
    throw error;
  }
};

/**
 * Search for content in the database
 * @param {Object} query - Search query object
 * @param {number} limit - Maximum number of results to return
 * @param {number} skip - Number of results to skip (for pagination)
 * @returns {Promise<Array>} - Array of matching content
 */
const searchContent = async (query, limit = 20, skip = 0) => {
  try {
    const {
      keyword,
      contentType,
      genre,
      language,
      cast,
      director,
      productionCompany,
      popularityTier,
      releaseYear,
    } = query;

    // Build search criteria
    const searchCriteria = {};

    // Text search for keyword (searches title, description, and cast)
    if (keyword) {
      searchCriteria.$text = { $search: keyword };
    }

    // Filter by content type (only if explicitly specified)
    if (contentType && contentType.trim() !== "") {
      searchCriteria.contentType = contentType;
    }

    // Filter by genre
    if (genre) {
      searchCriteria.genre = { $in: [genre] };
    }

    // Filter by language (only if explicitly specified)
    if (language && language.trim() !== "") {
      searchCriteria.language = language;
    }

    // Filter by cast
    if (cast) {
      searchCriteria.cast = { $in: [new RegExp(cast, "i")] };
    }

    // Filter by director
    if (director) {
      searchCriteria.director = new RegExp(director, "i");
    }

    // Filter by production company
    if (productionCompany) {
      searchCriteria.productionCompany = new RegExp(productionCompany, "i");
    }

    // Filter by popularity tier
    if (popularityTier) {
      searchCriteria.popularityTier = popularityTier;
    }

    // Filter by release year
    if (releaseYear) {
      searchCriteria.releaseYear = parseInt(releaseYear);
    }

    // Log the search criteria for debugging
    logger.debug(`Search criteria: ${JSON.stringify(searchCriteria)}`);

    // Execute search
    const results = await Content.find(searchCriteria)
      .sort({ viewCount: -1 }) // Sort by view count (most popular first)
      .limit(limit)
      .skip(skip);

    // Get total count for pagination
    const totalCount = await Content.countDocuments(searchCriteria);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      results,
      totalCount,
      totalPages,
    };
  } catch (error) {
    logger.error(`Error searching content: ${error.message}`);
    throw error;
  }
};

/**
 * Search for content in YouTube if not found in database
 * @param {string} keyword - Search keyword
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - Array of content from YouTube
 */
const searchYouTubeContent = async (keyword, limit = 20) => {
  try {
    logger.info(`Searching YouTube for content with keyword: ${keyword}`);

    // Search YouTube for content
    const searchResults = await searchYouTube(`Nigerian ${keyword}`, limit);

    if (!searchResults.items || searchResults.items.length === 0) {
      logger.warn(`No YouTube results found for keyword: ${keyword}`);
      return [];
    }

    // Get video IDs from search results
    const videoIds = searchResults.items.map((item) => item.id.videoId);

    // Get detailed video information
    const videoDetails = await getVideoDetails(videoIds);

    if (!videoDetails.items || videoDetails.items.length === 0) {
      logger.warn(`No video details found for keyword: ${keyword}`);
      return [];
    }

    // Process videos and save to database
    const processedVideos = [];

    for (const video of videoDetails.items) {
      const categorizedData = categorizeContent(video);

      // Extract all available thumbnail formats
      const thumbnails =
        video.snippet && video.snippet.thumbnails
          ? extractThumbnails(video.snippet.thumbnails)
          : {
              default: null,
              medium: null,
              high: null,
              standard: null,
              maxres: null,
            };

      const processedVideo = {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: new Date(video.snippet.publishedAt),
        thumbnails,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        viewCount: parseInt(video.statistics.viewCount) || 0,
        likeCount: parseInt(video.statistics.likeCount) || 0,
        commentCount: parseInt(video.statistics.commentCount) || 0,
        ...categorizedData,
      };

      // Save to database in background
      const newContent = new Content(processedVideo);
      newContent
        .save()
        .catch((err) =>
          logger.error(`Error saving YouTube content: ${err.message}`)
        );

      processedVideos.push(processedVideo);
    }

    logger.info(
      `Successfully processed ${processedVideos.length} videos from YouTube for keyword: ${keyword}`
    );
    return processedVideos;
  } catch (error) {
    logger.error(`Error searching YouTube content: ${error.message}`);
    throw error;
  }
};

/**
 * Get content by category
 * @param {string} categoryType - Type of category (contentType, genre, language, etc.)
 * @param {string} categoryValue - Value of the category
 * @param {number} limit - Maximum number of results to return
 * @param {number} skip - Number of results to skip (for pagination)
 * @returns {Promise<Object>} - Object with results array, total count, and pages
 */
const getContentByCategory = async (
  categoryType,
  categoryValue,
  limit = 20,
  skip = 0
) => {
  try {
    // Build search criteria based on category type
    const searchCriteria = {};

    switch (categoryType) {
      case "contentType":
        searchCriteria.contentType = categoryValue;
        break;
      case "genre":
        searchCriteria.genre = { $in: [categoryValue] };
        break;
      case "language":
        searchCriteria.language = categoryValue;
        break;
      case "series":
        searchCriteria.series = categoryValue;
        break;
      case "director":
        searchCriteria.director = new RegExp(categoryValue, "i");
        break;
      case "cast":
        searchCriteria.cast = { $in: [new RegExp(categoryValue, "i")] };
        break;
      case "productionCompany":
        searchCriteria.productionCompany = new RegExp(categoryValue, "i");
        break;
      case "popularityTier":
        searchCriteria.popularityTier = categoryValue;
        break;
      case "releaseYear":
        searchCriteria.releaseYear = parseInt(categoryValue);
        break;
      case "seasonal":
        searchCriteria.seasonal = categoryValue;
        break;
      default:
        throw new Error(`Invalid category type: ${categoryType}`);
    }

    // Log the search criteria for debugging
    logger.debug(`Category search criteria: ${JSON.stringify(searchCriteria)}`);

    // Execute search
    const results = await Content.find(searchCriteria)
      .sort({ viewCount: -1 }) // Sort by view count (most popular first)
      .limit(limit)
      .skip(skip);

    // Get total count for pagination
    const totalCount = await Content.countDocuments(searchCriteria);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      results,
      totalCount,
      totalPages,
    };
  } catch (error) {
    logger.error(`Error getting content by category: ${error.message}`);
    throw error;
  }
};

/**
 * Get trending content based on view velocity
 * @param {string|null} contentType - Optional content type filter (movie, tvshow)
 * @param {number} limit - Maximum number of results to return
 * @param {number} skip - Number of results to skip (for pagination)
 * @returns {Promise<Object>} - Object with results array, total count, and pages
 */
const getTrendingContent = async (contentType = null, limit = 20, skip = 0) => {
  try {
    // Get content published in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const searchCriteria = {
      publishedAt: { $gte: thirtyDaysAgo },
    };

    // Add content type filter if specified
    if (contentType) {
      searchCriteria.contentType = contentType;
    }

    // Find recent content with high view counts
    const results = await Content.find(searchCriteria)
      .sort({ viewCount: -1 }) // Sort by view count (most popular first)
      .limit(limit)
      .skip(skip);

    // Get total count for pagination
    const totalCount = await Content.countDocuments(searchCriteria);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      results,
      totalCount,
      totalPages,
    };
  } catch (error) {
    logger.error(`Error getting trending content: ${error.message}`);
    throw error;
  }
};

/**
 * Get all available categories and their counts
 * @returns {Promise<Object>} - Object with category counts
 */
const getCategoryCounts = async () => {
  try {
    // Get counts for content types
    const contentTypeCounts = await Content.aggregate([
      { $group: { _id: "$contentType", count: { $sum: 1 } } },
    ]);

    // Get counts for genres
    const genreCounts = await Content.aggregate([
      { $unwind: "$genre" },
      { $group: { _id: "$genre", count: { $sum: 1 } } },
    ]);

    // Get counts for languages
    const languageCounts = await Content.aggregate([
      { $group: { _id: "$language", count: { $sum: 1 } } },
    ]);

    // Get counts for production companies
    const productionCompanyCounts = await Content.aggregate([
      { $match: { productionCompany: { $ne: null } } },
      { $group: { _id: "$productionCompany", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Get counts for directors
    const directorCounts = await Content.aggregate([
      { $match: { director: { $ne: null } } },
      { $group: { _id: "$director", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Get counts for cast members
    const castCounts = await Content.aggregate([
      { $unwind: "$cast" },
      { $group: { _id: "$cast", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Get counts for release years
    const releaseYearCounts = await Content.aggregate([
      { $group: { _id: "$releaseYear", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    return {
      contentTypes: contentTypeCounts,
      genres: genreCounts,
      languages: languageCounts,
      productionCompanies: productionCompanyCounts,
      directors: directorCounts,
      cast: castCounts,
      releaseYears: releaseYearCounts,
    };
  } catch (error) {
    logger.error(`Error getting category counts: ${error.message}`);
    throw error;
  }
};

/**
 * Seed the database with content for specific genres
 * @param {number} resultsPerGenre - Number of results to fetch per genre
 * @returns {Promise<Object>} - Object with genre counts
 */
const seedGenres = async (resultsPerGenre = 15) => {
  try {
    logger.info(
      `Starting genre-specific seeding (${resultsPerGenre} items per genre)`
    );

    // Get available genres from the genreKeywords object
    const genres = Object.keys(genreKeywords);
    const results = {};

    // Process each genre
    for (const genre of genres) {
      logger.info(`Seeding ${genre} genre content...`);

      // Check current count in database
      const count = await Content.countDocuments({ genre: { $in: [genre] } });
      logger.info(`Found ${count} existing ${genre} items in database`);

      // If we already have enough, skip
      if (count >= resultsPerGenre) {
        logger.info(`Already have ${count} ${genre} items, skipping`);
        results[genre] = { existing: count, added: 0, total: count };
        continue;
      }

      // Determine how many more to fetch
      const neededCount = resultsPerGenre - count;
      logger.info(`Fetching ${neededCount} more ${genre} items`);

      // Fetch content from YouTube
      // Use a larger limit to account for filtering
      const fetchLimit = Math.ceil(neededCount * 1.5);
      const savedItems = await fetchAndSaveContent(
        `Nigerian ${genre} movies`,
        fetchLimit
      );

      // Filter items that actually match the genre
      const matchingItems = savedItems.filter(
        (item) => item.genre && item.genre.includes(genre)
      );

      logger.info(
        `Successfully added ${matchingItems.length} new ${genre} items`
      );
      results[genre] = {
        existing: count,
        added: matchingItems.length,
        total: count + matchingItems.length,
      };
    }

    // Return results summary
    return results;
  } catch (error) {
    logger.error(`Error seeding genres: ${error.message}`);
    throw error;
  }
};

module.exports = {
  fetchAndSaveContent,
  searchContent,
  searchYouTubeContent,
  getContentByCategory,
  getTrendingContent,
  getCategoryCounts,
  seedGenres,
};

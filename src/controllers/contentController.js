const {
  searchContent,
  searchYouTubeContent,
  getContentByCategory,
  getTrendingContent,
  getCategoryCounts,
} = require("../services/contentService");
const logger = require("../config/logger");

/**
 * Search for content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const search = async (req, res) => {
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
    } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Build search query object
    const searchQuery = {};

    if (keyword) searchQuery.keyword = keyword;
    if (contentType) searchQuery.contentType = contentType;
    if (genre) searchQuery.genre = genre;
    if (language) searchQuery.language = language;
    if (cast) searchQuery.cast = cast;
    if (director) searchQuery.director = director;
    if (productionCompany) searchQuery.productionCompany = productionCompany;
    if (popularityTier) searchQuery.popularityTier = popularityTier;
    if (releaseYear) searchQuery.releaseYear = releaseYear;

    // Search in database
    const searchResult = await searchContent(searchQuery, limit, skip);
    const { results, totalCount, totalPages } = searchResult;

    // If no results found in database and keyword is provided, search YouTube
    if (results.length === 0 && keyword) {
      logger.info(
        `No results found in database for keyword: ${keyword}, searching YouTube`
      );
      const youtubeResults = await searchYouTubeContent(keyword, limit);

      return res.status(200).json({
        success: true,
        count: youtubeResults.length,
        page,
        pages: 1,
        totalCount: youtubeResults.length,
        data: youtubeResults,
        source: "youtube",
      });
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      page,
      pages: totalPages,
      totalCount,
      data: results,
      source: "database",
    });
  } catch (error) {
    logger.error(`Error in search controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * Get content by category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getByCategory = async (req, res) => {
  try {
    const { categoryType, categoryValue } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const minResults = 12; // Minimum number of results to return

    // Validate category type
    const validCategoryTypes = [
      "contentType",
      "genre",
      "language",
      "series",
      "director",
      "cast",
      "productionCompany",
      "popularityTier",
      "releaseYear",
      "seasonal",
    ];

    if (!validCategoryTypes.includes(categoryType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category type. Valid types are: ${validCategoryTypes.join(
          ", "
        )}`,
      });
    }

    // Get content by category from database
    const categoryResult = await getContentByCategory(
      categoryType,
      categoryValue,
      limit,
      skip
    );

    let { results, totalCount, totalPages } = categoryResult;

    // If we don't have enough results and this is a genre query
    // For genre queries, ensure we have at least minResults (12) or the requested limit, whichever is greater
    if (
      categoryType === "genre" &&
      results.length < Math.max(minResults, limit)
    ) {
      const actualMinNeeded = Math.max(minResults, limit);
      logger.info(
        `Not enough results (${results.length}/${actualMinNeeded}) for genre: ${categoryValue}, fetching additional content from YouTube`
      );

      // Determine how many more results we need
      const additionalNeeded = actualMinNeeded - results.length;

      // Search YouTube for additional content
      // Add 50% more to account for filtering
      const searchLimit = Math.ceil(additionalNeeded * 1.5);
      const youtubeResults = await searchYouTubeContent(
        `Nigerian ${categoryValue} movies`,
        searchLimit
      );

      // Filter YouTube results to try to match the genre (some may be incorrectly categorized)
      const filteredYoutubeResults = youtubeResults.filter(
        (item) => item.genre && item.genre.includes(categoryValue)
      );

      // Combine database and YouTube results
      // Use a Set of videoIds to avoid duplicates
      const existingVideoIds = new Set(results.map((item) => item.videoId));
      const uniqueYoutubeResults = filteredYoutubeResults.filter(
        (item) => !existingVideoIds.has(item.videoId)
      );

      // Only take as many as we need to reach our target
      const youtubeResultsToAdd = uniqueYoutubeResults.slice(
        0,
        additionalNeeded
      );

      results = [...results, ...youtubeResultsToAdd];

      // Update count for pagination
      totalCount += youtubeResultsToAdd.length;
      totalPages = Math.ceil(totalCount / limit);

      logger.info(
        `Added ${youtubeResultsToAdd.length} YouTube results for genre: ${categoryValue}, total results: ${results.length}`
      );
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      page,
      pages: totalPages,
      totalCount,
      data: results,
      source:
        results.length > categoryResult.results.length
          ? "database+youtube"
          : "database",
    });
  } catch (error) {
    logger.error(`Error in getByCategory controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * Get trending content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get trending content (passing null for contentType to get all types)
    const trendingResult = await getTrendingContent(null, limit, skip);
    const { results, totalCount, totalPages } = trendingResult;

    return res.status(200).json({
      success: true,
      count: results.length,
      page,
      pages: totalPages,
      totalCount,
      data: results,
    });
  } catch (error) {
    logger.error(`Error in getTrending controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * Get trending movies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrendingMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get trending movies
    const trendingResult = await getTrendingContent("movie", limit, skip);
    const { results, totalCount, totalPages } = trendingResult;

    return res.status(200).json({
      success: true,
      count: results.length,
      page,
      pages: totalPages,
      totalCount,
      data: results,
    });
  } catch (error) {
    logger.error(`Error in getTrendingMovies controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * Get trending TV shows
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrendingTVShows = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get trending TV shows
    const trendingResult = await getTrendingContent("tvshow", limit, skip);
    const { results, totalCount, totalPages } = trendingResult;

    return res.status(200).json({
      success: true,
      count: results.length,
      page,
      pages: totalPages,
      totalCount,
      data: results,
    });
  } catch (error) {
    logger.error(`Error in getTrendingTVShows controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * Get all categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCategories = async (req, res) => {
  try {
    // Get category counts
    const categories = await getCategoryCounts();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error(`Error in getCategories controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

module.exports = {
  search,
  getByCategory,
  getTrending,
  getTrendingMovies,
  getTrendingTVShows,
  getCategories,
};

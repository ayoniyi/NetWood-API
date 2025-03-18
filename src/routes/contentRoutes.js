const express = require("express");
const {
  search,
  getByCategory,
  getTrending,
  getTrendingMovies,
  getTrendingTVShows,
  getCategories,
} = require("../controllers/contentController");
const {
  fetchAndSaveContent,
  seedGenres,
} = require("../services/contentService");
const logger = require("../config/logger");

const router = express.Router();

/**
 * @route   GET /api/content/search
 * @desc    Search for content
 * @access  Public
 */
router.get("/search", search);

/**
 * @route   GET /api/content/category/:categoryType/:categoryValue
 * @desc    Get content by category
 * @access  Public
 */
router.get("/category/:categoryType/:categoryValue", getByCategory);

/**
 * @route   GET /api/content/trending
 * @desc    Get trending content
 * @access  Public
 */
router.get("/trending", getTrending);

/**
 * @route   GET /api/content/trending/movies
 * @desc    Get trending movies
 * @access  Public
 */
router.get("/trending/movies", getTrendingMovies);

/**
 * @route   GET /api/content/trending/tvshows
 * @desc    Get trending TV shows
 * @access  Public
 */
router.get("/trending/tvshows", getTrendingTVShows);

/**
 * @route   GET /api/content/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get("/categories", getCategories);

/**
 * @route   POST /api/content/seed
 * @desc    Manually seed the database with content from YouTube
 * @access  Public
 */
router.post("/seed", async (req, res) => {
  try {
    const { query = "Nigerian movies", limit = 20 } = req.body;

    logger.info(
      `Manual seeding requested for query: ${query}, limit: ${limit}`
    );

    // Fetch and save content
    const savedContent = await fetchAndSaveContent(query, limit);

    return res.status(200).json({
      success: true,
      message: `Successfully seeded database with ${savedContent.length} items`,
      count: savedContent.length,
    });
  } catch (error) {
    logger.error(`Error in manual seeding: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
});

/**
 * @route   POST /api/content/seed/genres
 * @desc    Seed the database with content for each genre to ensure minimum content availability
 * @access  Public
 */
router.post("/seed/genres", async (req, res) => {
  try {
    const { resultsPerGenre = 15 } = req.body;

    logger.info(
      `Genre-specific seeding requested (${resultsPerGenre} items per genre)`
    );

    // Seed genres
    const results = await seedGenres(resultsPerGenre);

    return res.status(200).json({
      success: true,
      message: `Successfully seeded genres with target of ${resultsPerGenre} items per genre`,
      results,
    });
  } catch (error) {
    logger.error(`Error in genre seeding: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
});

module.exports = router;

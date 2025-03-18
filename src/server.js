const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/database");
const logger = require("./config/logger");
const { initCronJobs } = require("./services/cronService");
const { seedGenres } = require("./services/contentService");
const contentRoutes = require("./routes/contentRoutes");
const errorHandler = require("./middlewares/errorHandler");
const apiLimiter = require("./middlewares/rateLimiter");
const Content = require("./models/Content");
const seedDatabase = require("./utils/seedDatabase");

// Load environment variables
dotenv.config();

// Verify YouTube API key
const verifyApiKey = () => {
  if (!process.env.YOUTUBE_API_KEY) {
    logger.error(
      "YouTube API key is missing. Please set YOUTUBE_API_KEY in your .env file."
    );
    return false;
  }

  // if (process.env.YOUTUBE_API_KEY === "your_youtube_api_key") {
  //   logger.error(
  //     "YouTube API key is set to the default placeholder value. Please update it with a valid API key."
  //   );
  //   return false;
  // }

  logger.info(
    `Using YouTube API key: ${process.env.YOUTUBE_API_KEY.substring(0, 5)}...`
  );
  return true;
};

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// HTTP request logger
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Apply rate limiting to API routes
app.use("/api", apiLimiter);

// API routes
app.use("/api/content", contentRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Nolewood API",
    version: "1.0.0",
  });
});

// Error handler middleware
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Check if database is empty and seed if needed
const checkAndSeedDatabase = async () => {
  try {
    // Verify API key before attempting to seed
    if (!verifyApiKey()) {
      logger.error("Cannot seed database: Invalid YouTube API key");
      return;
    }

    const count = await Content.countDocuments();
    if (count === 0) {
      logger.info("Database is empty. Starting initial seeding process...");
      // Only seed with a few queries to avoid rate limiting during startup
      const initialQueries = [
        "Nigerian movies 2023",
        "Nollywood latest movies",
        "Nigerian TV shows",
      ];

      for (const query of initialQueries) {
        try {
          const { fetchAndSaveContent } = require("./services/contentService");
          const savedContent = await fetchAndSaveContent(query, 10);

          if (savedContent && savedContent.length > 0) {
            logger.info(
              `Initial seeding completed for query: ${query}, saved ${savedContent.length} items`
            );
          } else {
            logger.warn(`No content saved for query: ${query}`);
          }

          // Wait between requests
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          logger.error(
            `Error during initial seeding for query "${query}": ${error.message}`
          );
          if (error.response) {
            logger.error(`Response status: ${error.response.status}`);
            logger.error(
              `Response data: ${JSON.stringify(error.response.data)}`
            );
          }
        }
      }

      logger.info(
        "Initial database seeding completed. Run npm run seed for more content."
      );
    } else {
      logger.info(
        `Database already contains ${count} items. Skipping initial seeding.`
      );
    }

    // Check if genres have minimum content
    logger.info("Checking if genres have enough content...");

    // Get minimum content per genre
    const minGenreContent = 12;

    // Query the database to find genres with fewer than minGenreContent items
    const { genreKeywords } = require("./utils/categorizer");
    const genres = Object.keys(genreKeywords);
    const genresToSeed = [];

    // Check each genre
    for (const genre of genres) {
      const genreCount = await Content.countDocuments({
        genre: { $in: [genre] },
      });
      if (genreCount < minGenreContent) {
        genresToSeed.push({ genre, count: genreCount });
      }
    }

    // If any genres need seeding, seed them
    if (genresToSeed.length > 0) {
      logger.info(
        `Found ${genresToSeed.length} genres with less than ${minGenreContent} items. Seeding genres...`
      );
      genresToSeed.forEach((g) => {
        logger.info(
          `Genre "${g.genre}" has only ${g.count}/${minGenreContent} items`
        );
      });

      // Seed genres with minimum content
      try {
        const results = await seedGenres(minGenreContent);
        logger.info(
          `Genre seeding completed. Results: ${JSON.stringify(results)}`
        );
      } catch (error) {
        logger.error(`Error during genre seeding: ${error.message}`);
      }
    } else {
      logger.info(
        `All genres have at least ${minGenreContent} items. Skipping genre seeding.`
      );
    }
  } catch (error) {
    logger.error(`Error checking database: ${error.message}`);
  }
};

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Check and seed database if empty
  await checkAndSeedDatabase();

  // Initialize cron jobs
  initCronJobs();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  logger.error(err.stack);

  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;

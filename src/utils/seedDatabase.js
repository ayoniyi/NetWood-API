const { fetchAndSaveContent } = require("../services/contentService");
const logger = require("../config/logger");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Initial search queries for seeding the database
const initialQueries = [
  "Nigerian movies 2023",
  "Nollywood latest movies",
  "Nigerian TV shows",
  "Yoruba movies",
  "Igbo movies",
  "Hausa movies",
  "Nigerian comedy movies",
  "Nigerian drama movies",
  "Nigerian action movies",
  "Nigerian romance movies",
  "Nigerian thriller movies",
];

/**
 * Verify that the YouTube API key is set
 */
const verifyApiKey = () => {
  if (!process.env.YOUTUBE_API_KEY) {
    logger.error(
      "YouTube API key is missing. Please set YOUTUBE_API_KEY in your .env file."
    );
    return false;
  }

  if (process.env.YOUTUBE_API_KEY === "your_youtube_api_key") {
    logger.error(
      "YouTube API key is set to the default placeholder value. Please update it with a valid API key."
    );
    return false;
  }

  return true;
};

/**
 * Seed the database with initial content
 */
const seedDatabase = async () => {
  try {
    // Verify API key before proceeding
    if (!verifyApiKey()) {
      process.exit(1);
    }

    logger.info(
      `Using YouTube API key: ${process.env.YOUTUBE_API_KEY.substring(0, 5)}...`
    );

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB Connected for database seeding");

    logger.info("Starting database seeding process...");
    let totalSaved = 0;
    let failedQueries = 0;

    // Process each search query
    for (const query of initialQueries) {
      logger.info(`Processing seed query: ${query}`);

      try {
        // Fetch and save content for the query
        const savedContent = await fetchAndSaveContent(query, 20);

        if (savedContent && savedContent.length > 0) {
          totalSaved += savedContent.length;
          logger.info(`Saved ${savedContent.length} items for query: ${query}`);
        } else {
          logger.warn(`No content saved for query: ${query}`);
        }

        // Wait a bit between requests to avoid rate limiting
        logger.info(
          "Waiting 3 seconds before next query to avoid rate limiting..."
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        failedQueries++;
        logger.error(
          `Error processing seed query "${query}": ${error.message}`
        );

        // If we've failed multiple queries, there might be an issue with the API key
        if (failedQueries >= 3) {
          logger.error(
            "Multiple query failures. Please check your YouTube API key and quota limits."
          );
          process.exit(1);
        }

        // Wait longer after an error to avoid rate limiting
        logger.info("Waiting 5 seconds after error before next query...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
    }

    if (totalSaved > 0) {
      logger.info(
        `Database seeding completed. Total items saved: ${totalSaved}`
      );
    } else {
      logger.error("Database seeding failed. No items were saved.");
    }

    process.exit(totalSaved > 0 ? 0 : 1);
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

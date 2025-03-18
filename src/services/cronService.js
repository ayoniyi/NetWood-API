const cron = require("node-cron");
const { fetchAndSaveContent } = require("./contentService");
const logger = require("../config/logger");

// Search queries for different content types
const searchQueries = [
  "Nigerian movies",
  "Nollywood movies",
  "Nigerian TV shows",
  "Nigerian series",
  "Yoruba movies",
  "Igbo movies",
  "Hausa movies",
  "Nigerian comedy movies",
  "Nigerian drama movies",
  "Nigerian action movies",
  "Nigerian romance movies",
];

/**
 * Initialize cron jobs for updating content
 */
const initCronJobs = () => {
  // Run daily at midnight to update content
  cron.schedule("0 0 * * *", async () => {
    logger.info("Running daily content update cron job");

    try {
      // Process each search query
      for (const query of searchQueries) {
        logger.info(`Processing search query: ${query}`);

        try {
          // Fetch and save content for the query
          const savedContent = await fetchAndSaveContent(query, 50);
          logger.info(
            `Updated ${savedContent.length} items for query: ${query}`
          );

          // Wait a bit between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          logger.error(`Error processing query "${query}": ${error.message}`);
          // Continue with next query even if this one fails
          continue;
        }
      }

      logger.info("Daily content update completed successfully");
    } catch (error) {
      logger.error(`Error in daily content update cron job: ${error.message}`);
    }
  });

  logger.info("Cron jobs initialized");
};

module.exports = {
  initCronJobs,
};

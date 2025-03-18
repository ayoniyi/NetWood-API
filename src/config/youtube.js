const { google } = require("googleapis");
const logger = require("./logger");

// Initialize the YouTube API client
const getYouTubeClient = () => {
  // Make sure the API key is available
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error(
      "YouTube API key is missing. Please set YOUTUBE_API_KEY in your .env file."
    );
  }

  return google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
  });
};

// Function to search for Nigerian movies and TV shows
const searchYouTube = async (query, maxResults = 50, pageToken = null) => {
  try {
    const youtube = getYouTubeClient();

    const params = {
      part: "snippet",
      q: query,
      maxResults,
      type: "video",
      videoDefinition: "high",
      relevanceLanguage: "en",
      regionCode: "NG",
      pageToken,
      key: process.env.YOUTUBE_API_KEY, // Explicitly include the API key in the request
    };

    logger.info(`Searching YouTube for: ${query}`);
    const response = await youtube.search.list(params);
    return response.data;
  } catch (error) {
    logger.error(`YouTube API Error: ${error.message}`);
    if (error.response) {
      logger.error(`Response status: ${error.response.status}`);
      logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

// Function to get video details including statistics and all thumbnail formats
const getVideoDetails = async (videoIds) => {
  try {
    if (!videoIds || videoIds.length === 0) {
      return { items: [] };
    }

    const youtube = getYouTubeClient();

    // Request more detailed information including all available thumbnails
    // The 'snippet' part includes thumbnails (default, medium, high, standard, maxres)
    const response = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videoIds.join(","),
      key: process.env.YOUTUBE_API_KEY, // Explicitly include the API key in the request
    });

    // Log thumbnail availability for debugging
    if (
      response.data &&
      response.data.items &&
      response.data.items.length > 0
    ) {
      const firstVideo = response.data.items[0];
      if (firstVideo.snippet && firstVideo.snippet.thumbnails) {
        const availableThumbnails = Object.keys(firstVideo.snippet.thumbnails);
        logger.debug(
          `Available thumbnail formats: ${availableThumbnails.join(", ")}`
        );
      }
    }

    return response.data;
  } catch (error) {
    logger.error(`YouTube API Error: ${error.message}`);
    if (error.response) {
      logger.error(`Response status: ${error.response.status}`);
      logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

module.exports = {
  searchYouTube,
  getVideoDetails,
};

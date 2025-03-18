/**
 * Utility functions for categorizing Nigerian movies and TV shows
 */

// Genre keywords for detection
const genreKeywords = {
  romance: [
    "romance",
    "love",
    "romantic",
    "heart",
    "passion",
    "affair",
    "relationship",
  ],
  action: [
    "action",
    "fight",
    "battle",
    "war",
    "gun",
    "combat",
    "mission",
    "soldier",
  ],
  comedy: ["comedy", "funny", "hilarious", "laugh", "humor", "joke", "comical"],
  drama: ["drama", "emotional", "family", "life", "struggle", "pain", "tears"],
  thriller: [
    "thriller",
    "suspense",
    "mystery",
    "crime",
    "detective",
    "murder",
    "investigation",
  ],
  horror: [
    "horror",
    "scary",
    "ghost",
    "haunted",
    "fear",
    "terror",
    "supernatural",
  ],
};

// Language keywords for detection
const languageKeywords = {
  English: ["english"],
  Yoruba: ["yoruba"],
  Igbo: ["igbo"],
  Hausa: ["hausa"],
  Pidgin: ["pidgin", "broken english", "naija pidgin"],
};

// Seasonal keywords for detection
const seasonalKeywords = {
  Christmas: ["christmas", "xmas", "noel", "yuletide", "holiday season"],
  Easter: ["easter", "resurrection", "paschal"],
  NewYear: ["new year", "newyear"],
  Valentine: ["valentine", "val day", "lovers day"],
  Independence: ["independence", "october 1st", "nigeria independence"],
};

/**
 * Detect genres from title and description
 * @param {string} title - Content title
 * @param {string} description - Content description
 * @returns {string[]} - Array of detected genres
 */
const detectGenres = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const detectedGenres = [];

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        detectedGenres.push(genre);
        break; // Found a match for this genre, move to next genre
      }
    }
  }

  return [...new Set(detectedGenres)]; // Remove duplicates
};

/**
 * Detect language from title and description
 * @param {string} title - Content title
 * @param {string} description - Content description
 * @returns {string} - Detected language or 'English' as default
 */
const detectLanguage = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  for (const [language, keywords] of Object.entries(languageKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return language;
      }
    }
  }

  return "English"; // Default language
};

/**
 * Detect if content is part of a series and which part
 * @param {string} title - Content title
 * @returns {Object} - Object with series name and part number
 */
const detectSeries = (title) => {
  // Check for "Part X" pattern
  const partMatch = title.match(/part\s+(\d+)/i);

  // Check for "Season X" pattern
  const seasonMatch = title.match(/season\s+(\d+)/i);

  // Check for "Episode X" pattern
  const episodeMatch = title.match(/episode\s+(\d+)/i);

  // Check for "S01E01" pattern
  const s01e01Match = title.match(/S(\d+)E(\d+)/i);

  if (partMatch || seasonMatch || episodeMatch || s01e01Match) {
    // Try to extract the series name (everything before the part/season/episode)
    let seriesName = null;
    let part = null;

    if (partMatch) {
      const partIndex = title.toLowerCase().indexOf("part");
      seriesName = title.substring(0, partIndex).trim();
      part = parseInt(partMatch[1]);
    } else if (seasonMatch) {
      const seasonIndex = title.toLowerCase().indexOf("season");
      seriesName = title.substring(0, seasonIndex).trim();
      part = parseInt(seasonMatch[1]);
    } else if (episodeMatch) {
      const episodeIndex = title.toLowerCase().indexOf("episode");
      seriesName = title.substring(0, episodeIndex).trim();
      part = parseInt(episodeMatch[1]);
    } else if (s01e01Match) {
      const s01e01Index = title.indexOf("S");
      seriesName = title.substring(0, s01e01Index).trim();
      part = parseInt(s01e01Match[2]); // Use episode number as part
    }

    return {
      series: seriesName,
      part: part,
    };
  }

  return {
    series: null,
    part: null,
  };
};

/**
 * Detect seasonal content
 * @param {string} title - Content title
 * @param {string} description - Content description
 * @returns {string|null} - Detected season or null
 */
const detectSeasonal = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  for (const [season, keywords] of Object.entries(seasonalKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return season;
      }
    }
  }

  return null;
};

/**
 * Detect content type (movie or TV show)
 * @param {string} title - Content title
 * @param {string} description - Content description
 * @returns {string} - 'movie' or 'tvshow'
 */
const detectContentType = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  // TV show indicators
  const tvShowKeywords = [
    "series",
    "episode",
    "season",
    "tv show",
    "television",
    "show",
    "sitcom",
    "soap opera",
    "drama series",
    "web series",
  ];

  for (const keyword of tvShowKeywords) {
    if (text.includes(keyword)) {
      return "tvshow";
    }
  }

  // Check for series/episode patterns
  const { series, part } = detectSeries(title);
  if (series && part) {
    // If it has season/episode markers, it's likely a TV show
    if (
      title.toLowerCase().includes("season") ||
      title.toLowerCase().includes("episode")
    ) {
      return "tvshow";
    }
  }

  return "movie"; // Default to movie
};

/**
 * Extract cast members from description
 * @param {string} description - Content description
 * @returns {string[]} - Array of detected cast members
 */
const extractCast = (description) => {
  const castIndicators = [
    "starring",
    "stars",
    "featuring",
    "cast",
    "actors",
    "actresses",
    "lead role",
    "main role",
    "supporting role",
  ];

  let castText = null;

  // Look for cast indicators in the description
  for (const indicator of castIndicators) {
    const index = description.toLowerCase().indexOf(indicator);
    if (index !== -1) {
      // Extract text after the indicator
      castText = description.substring(index + indicator.length).trim();
      break;
    }
  }

  if (!castText) return [];

  // Split by common separators and clean up
  const castMembers = castText
    .split(/,|\.|and|&|with|alongside/)
    .map((name) => name.trim())
    .filter((name) => name.length > 2 && !/^\d+$/.test(name)); // Filter out empty or numeric-only strings

  return [...new Set(castMembers)]; // Remove duplicates
};

/**
 * Extract director from description
 * @param {string} description - Content description
 * @returns {string|null} - Detected director or null
 */
const extractDirector = (description) => {
  const directorIndicators = [
    "directed by",
    "director",
    "a film by",
    "filmmaker",
  ];

  for (const indicator of directorIndicators) {
    const index = description.toLowerCase().indexOf(indicator);
    if (index !== -1) {
      // Extract text after the indicator
      const afterIndicator = description
        .substring(index + indicator.length)
        .trim();
      // Take the first name until a punctuation or conjunction
      const directorMatch = afterIndicator.match(/^([^,.;:!?&]+)/);
      if (directorMatch && directorMatch[1]) {
        return directorMatch[1].trim();
      }
    }
  }

  return null;
};

/**
 * Extract production company from description
 * @param {string} description - Content description
 * @returns {string|null} - Detected production company or null
 */
const extractProductionCompany = (description) => {
  const companyIndicators = [
    "produced by",
    "production of",
    "a .* production",
    "presents",
    "studios",
  ];

  for (const indicator of companyIndicators) {
    const regex = new RegExp(indicator + "\\s+([^,.;:!?&]+)", "i");
    const match = description.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

/**
 * Categorize content based on title and description
 * @param {Object} videoData - Video data from YouTube API
 * @returns {Object} - Categorized content data
 */
const categorizeContent = (videoData) => {
  const { title, description } = videoData.snippet;

  // Detect content type (movie or TV show)
  const contentType = detectContentType(title, description);

  // Detect genres
  const genres = detectGenres(title, description);

  // Detect language
  const language = detectLanguage(title, description);

  // Detect series and part
  const { series, part } = detectSeries(title);

  // Detect seasonal content
  const seasonal = detectSeasonal(title, description);

  // Extract cast, director, and production company
  const cast = extractCast(description);
  const director = extractDirector(description);
  const productionCompany = extractProductionCompany(description);

  return {
    contentType,
    genre: genres,
    language,
    series,
    part,
    seasonal,
    cast,
    director,
    productionCompany,
  };
};

module.exports = {
  categorizeContent,
  genreKeywords,
  languageKeywords,
  seasonalKeywords,
  detectGenres,
  detectLanguage,
  detectContentType,
  detectSeries,
  detectSeasonal,
  extractCast,
  extractDirector,
  extractProductionCompany,
};

const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    publishedAt: {
      type: Date,
      required: true,
    },
    thumbnails: {
      default: { url: String, width: Number, height: Number },
      medium: { url: String, width: Number, height: Number },
      high: { url: String, width: Number, height: Number },
      standard: { url: String, width: Number, height: Number },
      maxres: { url: String, width: Number, height: Number },
    },
    channelId: {
      type: String,
      required: true,
    },
    channelTitle: {
      type: String,
      required: true,
    },
    // Main categories
    contentType: {
      type: String,
      enum: ["movie", "tvshow"],
      required: true,
    },
    // Content-based categories
    genre: {
      type: [String],
      default: [],
    },
    series: {
      type: String,
      default: null,
    },
    part: {
      type: Number,
      default: null,
    },
    language: {
      type: String,
      enum: ["English", "Yoruba", "Igbo", "Hausa", "Pidgin", "Other"],
      default: "English",
    },
    // Production-based categories
    productionCompany: {
      type: String,
      default: null,
    },
    director: {
      type: String,
      default: null,
    },
    cast: {
      type: [String],
      default: [],
    },
    // Engagement metrics
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    popularityTier: {
      type: String,
      enum: ["viral", "popular", "moderate", "niche"],
      default: "niche",
    },
    // Age/Recency
    releaseYear: {
      type: Number,
    },
    // Seasonal/Holiday
    seasonal: {
      type: String,
      default: null,
    },
    // Last updated timestamp
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search
ContentSchema.index({ title: "text", description: "text", cast: "text" });

// Calculate popularity tier based on view count
ContentSchema.pre("save", function (next) {
  if (this.viewCount >= 1000000) {
    this.popularityTier = "viral";
  } else if (this.viewCount >= 500000) {
    this.popularityTier = "popular";
  } else if (this.viewCount >= 100000) {
    this.popularityTier = "moderate";
  } else {
    this.popularityTier = "niche";
  }

  // Extract release year from title or published date if not set
  if (!this.releaseYear) {
    // Try to extract year from title (e.g., "Movie Title (2023)")
    const yearMatch = this.title.match(/\((\d{4})\)/);
    if (yearMatch && yearMatch[1]) {
      this.releaseYear = parseInt(yearMatch[1]);
    } else {
      // Use published year as fallback
      this.releaseYear = new Date(this.publishedAt).getFullYear();
    }
  }

  next();
});

const Content = mongoose.model("Content", ContentSchema);

module.exports = Content;

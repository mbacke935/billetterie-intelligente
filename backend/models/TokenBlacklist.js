const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // TTL : MongoDB supprime automatiquement le document une fois expiresAt dépassé
    index: { expires: 0 },
  },
});

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

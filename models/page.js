// models/Page.js
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  changefreq: { type: String, default: 'monthly' },
  priority: { type: Number, default: 0.8 },
  lastmod: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Page', pageSchema);
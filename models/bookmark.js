// models/Page.js
const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
    gameUrl : { type: String, required: true },
    userId: { type: String, required: true },
    dateAdded: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bookmark', BookmarkSchema);
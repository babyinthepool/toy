// models/Page.js
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    gameUrl : { type: String, required: true },
    userId: { type: String, required: true },
    dateAdded: { type: Date, default: Date.now },
    rating: { type: Number, required: true, min: 1, max: 5 }, // This already allows decimals like 4.5
});

module.exports = mongoose.model('Rating', RatingSchema);
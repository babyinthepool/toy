const mongoose = require('mongoose')

const updateSchema = new mongoose.Schema({
    title: { type: String },
    link: { type: String },
    summary: { type: String }
})


const GameSchema = new mongoose.Schema({
    name:{type:String},
    summary:{type:String},
    uploadDate: { type: Date, default: Date.now },
    gameOutDate: { type: Date },
    cover: {type:String},
    linkTorrent:{type:String},
    linkDirect:{type:String},
    linkDirectAlternative:{type:String},
    category:{type: Array},
    images:{type: Array},
    size:{type: Number},
    gameplayEmbed:{type: String},
    system:{type:String},
    views: {type:Number, default: 0},
    urlTitle: {type:String, unique:true},
    upgrades: [updateSchema],
    uploader: {type: String},
})

GameSchema.index({ name: 'text'});

const Game = mongoose.model('Game', GameSchema)
module.exports = Game;
const express=require("express")
const router=express.Router()

const Game = require("../models/game.js")
const Bookmark = require("../models/bookmark.js")
const Rating = require("../models/rating.js")
const TimeAgo = require("javascript-time-ago")
const az = require("javascript-time-ago/locale/az")
TimeAgo.addLocale(az)
TimeAgo.setDefaultLocale('az')
const timeAgo = new TimeAgo('az-AZ')
// momnent.js
const moment = require('moment')
moment.locale('az')
moment().format('LLL');

sliceDescription = (description) => {
    if (description.length > 155) {
        return description.slice(0, 155) + '...';
    }
    return description;
}
//how to use moment.js
router.get('/:urlTitle', async (req, res) => {
    const urlTitle = req.params.urlTitle;
    Game.findOne({ urlTitle }).lean()
        .then(async (game) => {
            if (!game) {
                res.status(404).send('404');
                return;
            }
            if (req.cookies.viewed != urlTitle) {
                res.cookie("viewed", urlTitle, { maxAge: 30 * 24 * 3600 * 1000, value: urlTitle });
                await Game.findOneAndUpdate({ urlTitle: urlTitle }, { views: game.views + 1 }, { new: true });
            }
            game.gameOutDate = moment(game.gameOutDate).format('ll');
            const seoDescription = sliceDescription(game.summary);
            game.uploadDate = timeAgo.format(game.uploadDate);
            if (req.session.user) {
                const bookmark = await Bookmark.findOne({ gameUrl: urlTitle, userId: req.session.user._id });
                if (bookmark !== null) {
                game.bookmarked = "yes";
                game.bookmarkId = bookmark ? bookmark._id : null;
                
                }

            }

            if (req.session.user) {
                const userRating = await Rating.findOne({ gameUrl: urlTitle, userId: req.session.user._id });
                game.userRating = userRating ? userRating.rating : null;
            }
            const ratings = await Rating.find({ gameUrl: urlTitle });
            let averageRating = null;
            total = 0;
            count = 0;

            if (ratings.length > 0) {
                ratings.forEach(rating => {
                    total += rating.rating;
                    count++;
                });

               
                averageRating = total / count;
                averageRating = parseFloat(averageRating.toFixed(1)); // Round to 1 decimal place

            }
                   
            game.averageRating = averageRating;
            const uploader = await require("../models/user.js").findById(game.uploader).lean();
            game.uploader = uploader ? {
                _id: uploader._id,
                username: uploader.username,
                pp: uploader.pp
            } : null;

            res.render("game/game", { game, seoDescription });
        })
        .catch(err => {
            res.status(404).send('404');f
            console.log(err);
        });
});
      


router.post("/:urlTitle/bookmark",async (req,res)=>{
    const urlTitle = req.params.urlTitle
    if(!req.session.user){
        res.json({status:"error",message:"Əvvəlcə daxil olun"})
        return
    }
    const userId = req.session.user._id

    Bookmark.findOne({gameUrl:urlTitle,userId})
    .then(async (bookmark)=>{
        if(bookmark){
            await Bookmark.findByIdAndDelete(bookmark._id)
            res.json({status:"success",message:"Oyun silindi"})
        }else{
            const newBookmark = new Bookmark({
                gameUrl:urlTitle,
                userId
            })
            await newBookmark.save()
            res.json({status:"success",message:"Oyun əlavə edildi"})
        }})

})

router.get("/:urlTitle/rating/:ratingValue",async (req,res)=>{

    const urlTitle = req.params.urlTitle
    const ratingValue = parseFloat(req.params.ratingValue)
    if(!req.session.user){
        res.json({status:"error",message:"Əvvəlcə daxil olun"})
        return
    }
    if(isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5){
        res.json({status:"error",message:"Yanlış qiymət"})
        return
    }
    const userId = req.session.user._id

    const existingRating = await Rating.findOne({gameUrl:urlTitle,userId})
    if(existingRating){
        existingRating.rating = ratingValue
        await existingRating.save()
        res.json({status:"success",message:"Qiymət yeniləndi"})
    }else{
        const newRating = new Rating({
            gameUrl:urlTitle,
            userId,
            rating:ratingValue,
        })
        await newRating.save()
        res.json({status:"success",message:"Qiymət əlavə edildi"})
    }

})


module.exports=router
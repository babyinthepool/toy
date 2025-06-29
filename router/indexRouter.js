const express=require("express")
const router=express.Router()

const Game = require("../models/game.js")
const Page = require("../models/page.js")
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');


//sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const pages = await Page.find();

    const links = pages.map(page => ({
      url: page.url,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: page.lastmod
    }));

    const stream = new SitemapStream({ hostname: 'https://www.torrentoyunyukle.xyz' });
    const xml = await streamToPromise(Readable.from(links).pipe(stream));

    res.header('Content-Type', 'application/xml');
    res.send(xml.toString());
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});





router.get('/',async (req,res)=>{
    const page = parseInt(req.query.page) || 1
    const limit = 12
    const totalGames = await Game.countDocuments()
    const totalPages = Math.ceil(totalGames/limit)

    
    

    Game.find()
    .sort({ _id: -1 })
    .skip((page-1)*limit)
    .limit(limit)
    .lean()
    .then(games=>{
       

        res.render("index/index",{
            games,
            currentPage:page,
            totalPages,
            hasNextPage: page<totalPages,
            hasPrevPage: page>1,
            nextPage: page+1,
            prevPage: page-1,
            adminState: res.locals.admin || false
        })
        
    })
    .catch(err =>{
        res.send("index")
        console.log(err);
    })
    
})

router.get("/axtar",async (req,res)=>{


    const search = req.query.oyun

    const page = parseInt(req.query.sehife) || 1
    const limit = 12
    const totalGames = await Game.find({$text: { $search: search }}).countDocuments()
    const totalPages = Math.ceil(totalGames/limit)

    Game.find({
        $text: { $search: search }, 
          
      })
      .skip((page-1)*limit)
      .limit(limit)
      .lean()
    .then(games=>{
        res.render("index",{
            games,
            currentPage:page,
            totalPages,
            hasNextPage: page<totalPages,
            hasPrevPage: page>1,
            nextPage: page+1,
            prevPage: page-1,
            search: search
        })
    })
    .catch(err=>{
        res.send("404")
        console.log(err)
    })
})

router.get("/kateqoriya/:category", (req,res)=>{
    const category = req.params.category

    Game.find({
        category: { $regex: new RegExp(category, 'i') }

    })
    .sort({ _id: -1 })
    .limit(10)
    .lean()
    .then(games=>{
        res.render("index/index",{games,category})
    })
})





module.exports=router
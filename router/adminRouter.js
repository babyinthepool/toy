const express=require("express")
const router=express.Router()
const {checkAdmin} = require('../middlewares.js')
 
const cheerio = require('cheerio')
const request = require('request')

const Page = require("../models/page.js")
const Game = require("../models/game.js")
const youtubeapikey = process.env.youtubeApiKey
const steamGridDbKey = process.env.steamGridDbKey
const moment = require('moment')
const axios = require('axios');
moment.locale('az')

function getYouTubeID(input) {
  // Eğer doğrudan 11 karakterlik video ID'si verilmişse, onu döndür
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
    return input;
  }
  
  // Değilse URL içerisinden ID'yi çıkar
  const regex = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const match = input.match(regex);
  return match ? match[1] : null;
}



const adminHash = process.env.secret


//main
router.get('/',checkAdmin,(req,res)=>{
    res.render('admin/adminIndex')
})

//upload
router.post("/game/update/:gameId",checkAdmin,(req,res)=>{
    var {name, category,gameOutDate,summary,system,cover,gameplayEmbed,images,linkTorrent,linkDirect,linkDirectAlternative,size} = req.body;
    uploadDate = Date.now()
    category = category.split(',')
    images=images.split(',')
const gameplayEmbedId = getYouTubeID(gameplayEmbed)




    const id = req.params.gameId
    Game.findOneAndUpdate({_id:id},{name,uploadDate, category,gameOutDate,summary,system,cover,gameplayEmbed:gameplayEmbedId,images,linkTorrent,linkDirect,linkDirectAlternative,size},{new:true}).lean()
    .then(game=>{
        res.redirect(`/admin/game/update/${id}`)
    })
    .catch(err=>{
        res.send("404")
        console.log(err)
    })
})
router.get('/game/upload',checkAdmin,(req,res)=>{
    res.render('admin/gameUpload')
})

//upload with ai
router.get("/game/uploadwithai",checkAdmin,(req,res)=>{
    res.render('admin/gameUploadWAi')
})




router.get("/api/steam/:appid", async (req, res) => {
  try {
    const appid = req.params.appid;
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appid}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Xəta baş verdi" });
  }
});


router.get('/api/cover/:appid', async (req, res) => {
  const steamAppId = req.params.appid;

  if (!steamAppId) {
    return res.status(400).json({ error: 'appid parametri tələb olunur' });
  }

  try {
    // 1. Steam App ID ilə SteamGridDB-də oyunu tap
    const gameRes = await axios.get(`https://www.steamgriddb.com/api/v2/games/steam/${steamAppId}`, {
      headers: { Authorization: `Bearer ${steamGridDbKey}` }
    });

    const gameData = gameRes.data.data;
    const gameId = gameData.id;

    // 2. Grid şəkillərini çək
    const gridRes = await axios.get(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}`, {
      headers: { Authorization: `Bearer ${steamGridDbKey}` }
    });

    const images = gridRes.data.data.map(img => img.url);

    res.json({
      steam_appid: steamAppId,
      game_name: gameData.name,
      steamgriddb_id: gameId,
      images
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Məlumat çəkilə bilmədi' });
  }
});

router.get("/api/youtube", async (req,res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parametresi tələb olunur: ?q=' });
  }
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${youtubeapikey}`;
    

  try {
    const response = await axios.get(url);
    const items = response.data.items;

    if (items.length === 0) {
      return res.status(404).json({ error: 'Video tapılmadı.' });
    }

    const videoId = items[0].id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    res.json({ videoUrl });
  } catch (error) {
    console.error('Xəta:', error.message);
    res.status(500).json({ error: 'Server xətası' });
  }

})




router.get('/api/get-appid', async (req, res) => {
  const gameName = req.query.name;
  if (!gameName) {
    return res.status(400).json({ error: 'name query parameter is required' });
  }

  try {
    const response = await axios.get('https://store.steampowered.com/api/storesearch/', {
      params: {
        term: gameName,
        cc: 'us',
        l: 'en'
      }
    });

    const items = response.data.items;
    if (items.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = items[0];
    res.json({
      name: game.name,
      appid: game.id,
      url: `https://store.steampowered.com/app/${game.id}/`
    });

  } catch (error) {
    res.status(500).json({ error: 'Something went wrong', details: error.message });
  }
});



router.get('/api/get-torrent', async (req, res) => {
    const gameName = req.query.q;
    if (!gameName) {
        return res.status(400).json({ error: 'name query parameter is required' });
    }
    try {

      const response = await axios.get('http://localhost:5000', {
        params: { q: gameName }
      });
      res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong', details: error.message });
    }

}
);

router.get('/game/update',(req,res)=>{
    Game.find().sort({ _id: -1 }).lean().limit(10)
    .then(games=>{
        res.render('admin/gameUpdate',{games})
    })
    .catch(err=>{
        res.send("404")
    })
})

router.get("/game/update/search",checkAdmin,(req,res)=>{
    const search = req.query.oyun
    Game.find({
        $text: { $search: search }
      })
    .limit(10)
    .lean()
    .then(games=>{
        res.render("admin/gameUpdate",{games})
    })
    .catch(err=>{
        res.send("404")
        console.log(err)
    })
})


//upgrade
router.get("/game/upgrade/:gameId",checkAdmin,async (req,res)=>{
    const id = req.params.gameId
    const game = await Game.findById(id).lean()
    if(game){
        res.render("admin/gameUpgrade",{upgrades:game.upgrades, game:game})
    } else {
        res.send("404")
    }
})

router.post("/game/upgrade/add/:gameId",checkAdmin,(req,res)=>{

    const id = req.params.gameId
    const {title, link, summary} = req.body

    Game.findOneAndUpdate(
        {_id: id},
        {$push: {upgrades: {title, link, summary}}},
        {new: true}
    ).lean()
    .then(game=>{
        res.redirect(`/admin/game/upgrade/${id}`)
    })
    .catch(err=>{
        res.send("404")
        console.log(err)
    })

})

router.get("/game/upgrade/:gameId/:upgradeId",checkAdmin, async(req,res)=>{
    const gameId = req.params.gameId
    const upgradeId = req.params.upgradeId

    
const game = await Game.findById(gameId).lean().catch(err => {
  res.send("404 - Game not found");
  return;
});


const upgrade = await game.upgrades.find(upg => upg._id.toString() === upgradeId.toString());

if (upgrade == undefined) {
  res.send("404 - Upgrade not found");
  return;
}

res.render("admin/gameUpgradeAlone", { game, upgrade });
})


router.get("/game/upgrade/delete/:gameId/:upgradeId",checkAdmin,(req,res)=>{   
    const gameId = req.params.gameId
    const upgradeId = req.params.upgradeId

    Game.findOneAndUpdate(
        {_id: gameId},
        {$pull: {upgrades: {_id: upgradeId}}},
        {new: true}
    ).lean()
    .then(game=>{
        res.redirect(`/admin/game/upgrade/${gameId}`)
    })
    .catch(err=>{
        res.send("404")
        console.log(err)
    })
})

router.post("/game/upgrade/edit/:gameId/:upgradeId",checkAdmin,(req,res)=>{
    const gameId = req.params.gameId
    const upgradeId = req.params.upgradeId
    const {title, link, summary} = req.body

    Game.findOneAndUpdate(
        {_id: gameId, "upgrades._id": upgradeId},
        {$set: {"upgrades.$.title": title, "upgrades.$.link": link, "upgrades.$.summary": summary}},
        {new: true}
    ).lean()
    .then(game=>{
        res.redirect(`/admin/game/upgrade/${gameId}/${upgradeId}`)
    })
    .catch(err=>{
        res.send("404")
        console.log(err)
    })
})
// game upload


router.post('/game/upload',checkAdmin,async (req,res)=>{
    var {name, category,gameOutDate,summary,system,cover,gameplayEmbed,images,linkTorrent,linkDirect,linkDirectAlternative,size} = req.body;
    category = category.split(',')
    function toSlug(str) {
  return str
    .toLowerCase()                 // Küçük harfe çevir
    .trim()                       // Baş ve sondaki boşlukları temizle
    .replace(/\s+/g, '-')         // Bir veya daha fazla boşluğu '-' yap
    .replace(/[^a-z0-9\-]/g, '')  // Harf, rakam ve '-' dışındakileri sil
    .replace(/-+/g, '-');          // Birden fazla '-' varsa tek yap
}




    const gameplayEmbedId = getYouTubeID(gameplayEmbed)
    const urlTitle = toSlug(name)
    images=images.split(',')


try {
  const newPage = new Page({
    url: urlTitle,
    lastmod: new Date()
  });

  await newPage.save();
} catch (err) {
          return res.redirect(`/${urlTitle}`)

}

const uploader = req.session.user ? req.session.user._id : null
    const newGame = new Game({
        name, category,gameOutDate,uploader,summary,system,cover,gameplayEmbed:gameplayEmbedId,images,linkTorrent,linkDirect,linkDirectAlternative,size,urlTitle
    });

    newGame.save()
    .then((savedGame)=>{
        return res.redirect(`/${urlTitle}`)
    })
    .catch((err)=>{
        res.redirect('/admin/game/upload')
    })
})

router.get("/add-index",checkAdmin,(req,res)=>{
res.render("admin/addIndex")


})
router.post("/add-index",checkAdmin,(req,res)=>{
    const {url, changefreq, priority} = req.body
    const lastmod = new Date().toISOString();
    const newPage = new Page({
        url,
        changefreq,
        priority,
        lastmod
    })
    newPage.save()
    .then(()=>{
        res.redirect("/admin/add-index")
    })
    .catch(err=>{
        res.send("Xeta bas verdi")
        console.log(err)
    })
})


router.get("/game/update/:gameId",checkAdmin,(req,res)=>{
    const id = req.params.gameId
    Game.findById(id).lean()
    .then(game=>{
    game.gameOutDate = moment(game.gameOutDate, 'YYYY-MM-DD').format('').slice(0,10) || ""
    // res.render('game/game',{game})
        res.render("admin/gameUpdateAlone",{game})
    })
    .catch(err=>{
        res.send('404')
      
    })
})



//games editing

router.get("/game/delete/:gameId",checkAdmin,(req,res)=>{
    var id = req.params.gameId
    Game.findOneAndDelete({_id:id})
    .then(()=>{
        res.redirect("/admin/game/update")
    })
    .catch(err=>{
        res.send("Silerken problem emele geldi")
    })
    
    
    })




module.exports=router
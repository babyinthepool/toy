const express=require("express")
const router=express.Router()
const User = require("../models/user.js")
const Rating = require("../models/rating.js")
const ImgurAnonymousUploader = require('imgur-anonymous-uploader');
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const Bookmark = require("../models/bookmark.js");
const Game = require("../models/game.js");
const { reverse } = require("dns");
const rating = require("../models/rating.js");
const moment = require('moment');
moment.locale('az')
const uploader = new ImgurAnonymousUploader('fd331815df1026e');
const uploadImage = async function (filePath) {
const uploadResponse = await uploader.upload(filePath);
return uploadResponse.url;
}

router.use((req, res, next) => {
    const openRoutes = [
        '/qeydiyyat',
        '/giris',
        '/register',
        '/login',
        "/goruntule",
        
    ];
    // Allow GET and POST for login/register pages
    if (
        (req.method === 'GET' || req.method === 'POST') &&
        openRoutes.some(route => req.path.startsWith(route))
    ) {
        return next();
    }
    // Require user session for all other routes
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/istifadeci/giris');
});

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Yalnız jpeg, png və gif formatları qəbul olunur."), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
});
router.post("/pp",async (req,res)=>{
    upload.single('pp')(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: "Şəkil göndərilməyib." });
        }
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext = path.extname(req.file.originalname) || '.jpg';
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFile(filePath, req.file.buffer, async (err) => {
            if (err) {
                return res.status(500).json({ error: "Şəkil saxlanılmadı." });
            }
            const newPp = await uploadImage(filePath)
User.findByIdAndUpdate(req.session.user._id, {pp: newPp})
.lean()
.then(user=>{
    res.redirect("/istifadeci/profil")

})
.catch(err=>{
    res.send("Xeta bas verdi")
})

        });
    });
})

router.get('/qeydiyyat',(req,res)=>{
    res.render("user/register")
})
router.get('/giris',(req,res)=>{
    res.render("user/login")
})
router.get("/profil",(req,res)=>{
    res.render("user/profil")
})
router.post("/qeydiyyat", (req,res)=>{
    const { email, username, password } = req.body;

    const usernameRegex = /^[a-z0-9]+$/;


    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validation
        if (!usernameRegex.test(username)) {
        return res.render("user/register", {email,username,password,warning:"İstifadəçi adında yalnız kiçik latın hərfləri və rəqəmlər ola bilər."});
    }
    if (
        !email || !username || !password ||
        typeof email !== "string" ||
        typeof username !== "string" ||
        typeof password !== "string"
    ) {
        return res.render("user/register", {email,username,password,warning:"Bütün sahələr doldurulmalıdır."})
    }

    if (!emailRegex.test(email)) {
    

        return res.render("user/register", {email,username,password,warning:"Email formatı yanlışdır."})
    }

    if (email.length > 100 || username.length > 50 || password.length > 50) {
        return res.render("user/register", {warning:"Sahələr çox uzundur."})
    }

    if (username.length < 4) {
                return res.render("user/register", {warning:"İstifadəçi adı 4 simvoldan balaca ola bilməz."})

    }

    if (password.length < 6) {
        return res.render("user/register", {warning:"Şifrə 6 simvoldan balaca ola bilməz."})
    }

    // Save user
    User.findOne({ $or: [{ email }, { username }] })
        .then(existingUser => {
            if (existingUser) {
                let warning = existingUser.email === email
                    ? "Bu email artıq istifadə olunub."
                    : "Bu istifadəçi adı artıq mövcuddur.";
                return res.render("user/register", { email, username, password, warning });
            }
            // Continue to save user if not found
            const newUser = new User({ email, username, password });
            return newUser.save()
                .then(() => res.redirect("/istifadeci/giris"))
                .catch(err => res.status(500).send("Error saving user."));
        })
        .catch(err => res.status(500).send("Server xətası."));
    return;
})

router.post("/sifre", (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || typeof oldPassword !== "string" || typeof newPassword !== "string") {
        return res.render("user/profil", { warning: "Bütün sahələr doldurulmalıdır." });
    }
    if (newPassword.length < 6) {
        return res.render("user/profil", { warning: "Şifrə 6 simvoldan balaca ola bilməz." });
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user || user.password !== oldPassword) {
                return res.render("user/profil", { warning: "Köhnə şifrə yanlışdır." });
            }
            user.password = newPassword;
            return user.save()
                .then(() => res.redirect("/istifadeci/profil", {warning: "Şifrə uğurla dəyişdirildi."}))
                .catch(err => res.status(500).send("Server xətası."));
        })
        .catch(err => res.status(500).send("Server xətası."));
}
)

router.get("/cixis", (req,res)=>{
    req.session.destroy()
    const redirectUrl = req.get('Referer') || '/';
    res.redirect(redirectUrl)
})

router.post("/giris",(req,res)=>{
    const { usernameEmail, password } = req.body;

    if (
        !usernameEmail || !password ||
        typeof usernameEmail !== "string" ||
        typeof password !== "string"
    ) {
        return res.render("user/login", { usernameEmail, password, warning: "Bütün sahələr doldurulmalıdır." });
    }

    if (usernameEmail.length > 100 || password.length > 50) {
        return res.render("user/login", { usernameEmail, password, warning: "Sahələr çox uzundur." });
    }

    User.findOne({
        $or: [
            { email: usernameEmail },
            { username: usernameEmail }
        ]
    })
    .then(user => {
        if (!user || user.password !== password) {
            return res.render("user/login", { usernameEmail, password, warning: "İstifadəçi tapılmadı və ya şifrə yanlışdır." });
        }
        req.session.user=user._id
        res.locals.user = user._id
        if(user.role =="admin"){
           req.session.admin = true
        }
        // Login successful, redirect to main page
        return res.redirect("/");
    })
    .catch(err => res.status(500).send("Server xətası."));

})

router.get("/yadda-saxlanilan-oyunlar", (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = 18
    const userId = req.session.user._id;
    Bookmark.find({ userId: userId })
        .lean()
        .then(async bookmarks => {
            const gameUrls = bookmarks.map(b => b.gameUrl);
            
                Game.find({ urlTitle: { $in: gameUrls } })
                .sort({ _id: -1 })
                .skip((page-1)*limit)
                .limit(limit)
                .lean()
                .then(async games=>{
                        const totalGames = await Game.find({ urlTitle: { $in: gameUrls } }).countDocuments()
                        const totalPages = Math.ceil(totalGames/limit)
                        games.reverse();
                                res.render("user/savedGames", { bookmarks, games,
            currentPage:page,
            totalPages,
            hasNextPage: page<totalPages,
            hasPrevPage: page>1,
            nextPage: page+1,
            prevPage: page-1,

             });
                })

  
            


        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Server xətası.");
        });
    }
);

router.get("/deyerlendirmeler", async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = 18
    const userId = req.session.user._id;
    try {
        const ratings = await Rating.find({ userId: userId })
            .sort({ _id: -1 })
            .skip((page-1)*limit)
            .limit(limit)
            .lean();
            ratings.forEach(rating => {
                rating.dateAdded = moment(rating.dateAdded).format('ll');
            });
        
        const totalRatings = await Rating.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalRatings / limit);
        res.render("user/ratings", {
            ratings,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server xətası.");
    }
});

router.get("/goruntule/:username", async (req, res) => {
    const username = req.params.username;
    try {
        const user = await User.findOne({ username }).lean();
        if (!user) {
            return res.status(404).render("404", { message: "İstifadəçi tapılmadı." });
        }
        if(user.role == "admin"){
            user.isAdmin = true;
        }
        res.render("user/page", { showUser:user, user: res.locals.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server xətası.");
    }
})
module.exports=router
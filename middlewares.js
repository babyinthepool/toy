exports.checkAdmin= (req,res,next) =>{
    if(req.session.admin==true){
        next()
    } else {
        res.redirect("/")
    }
}
exports.adminState= (req,res,next) =>{
    if(req.session.admin==true){
        res.locals.admin=true
    } else {
        res.locals.admin=false
    }
    next()
}
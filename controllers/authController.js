const passport = require("passport");

//Strategy is something that interferes with and checks if user allowed to log in or not.
//There could be be strategy facebook that check if user has got right/valid token
//
exports.login = passport.authenticate('local' , {
    failureRedirect : '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: "You are now logged in!"
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out! ✋');
    res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
    //Checking if user is already logged in
    if(req.isAuthenticated()){
        next(); //Yes carry on! User is logged in!
        return;
    }

    req.flash('error', 'Oops you must be logged in to do that');
    res.redirect('/login');
}
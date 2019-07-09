const passport = require("passport");
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');
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

exports.forgot = async (req, res) => {
    //1. see if a user with that email exists
    const user = await User.findOne({email : req.body.email});
    if(!user){
        req.flash('error', 'No account with that email exists');
        res.redirect('/login');
    }

    //2. set reset token and expiry on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    //3. send them an email with the token
    const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    await mail.send({
        user,
        subject: 'Password Reset',
        resetURL : resetUrl,
        filename: 'password-reset'
    });
    req.flash('success', `You have been emailed a password reset link.`);

    //4. redirect to login page
    res.redirect('/login');

};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt : Date.now()}
    });
    if(!user){
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }

    //If user exists, show the reset password form
    res.render('reset', {title: "Reset Your Password"});
};

exports.confirmedPasswords = (req, res, next) => {
    if(req.body.password === req.body["password-confirm"]){
        next();
        return;
    }
    req.flash('error', "Password do not match");
    res.redirect("back");
}

exports.update = async (req, res ) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt : Date.now()}
    });
    if(!user){
        req.flash('error', 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updateUser = await user.save();
    await req.login(updateUser);
    req.flash('Success', "💃 Nice! Your password has been reset! You are now logged in!");
    res.redirect('/');
}
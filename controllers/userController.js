const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login'})
};

exports.registerForm = (req, res) => {
    res.render('register', {title: 'Register'})
};

exports.validateRegister = (req, res, next) => {


    req.sanitizeBody('name') // sanitizeBody is not built in express req, but populated by expressValidator middleware, done in app.js
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.checkBody('email', 'That Email is not valid!').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'password cannot be blank !').notEmpty();
    req.checkBody('password-confirm', 'Confirm password can not be blank !').notEmpty();
    req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();
    if(errors){
        req.flash('error', errors.map(err => err.msg));
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
        return; // errors => stop from running
    }
    next();  // no errors => go next middle ware
};

exports.register = async (req, res, next) => {
    const user = new User({email : req.body.email, name: req.body.name});
    //register method added by passport-local-mongoose plugin add all lower methods
    // User.register(user, req.body.password, function(err, user){
    //     ... older way of attaching callback method, since register method does not support promise.
    //     But can written as promise using Promisify library as below
    // });
    const registerWithPromise = promisify(User.register, User);

    await registerWithPromise(user, req.body.password);
    next() // pass to authController.login


};

exports.account = (req, res) => {
    res.render('account', {title: 'Edit Your Account'});
}

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    }

    const user = await User.findOneAndUpdate(
        {_id: req.user._id},
        {$set: updates},
        {new : true, runValidators: true, context: 'query'}
    )
    req.flash('success', 'Updated the profile!');
    res.redirect('back')
}
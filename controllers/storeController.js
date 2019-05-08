const mongoose = require('mongoose');
const Store = mongoose.model('Store');


module.exports.homepage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
};

exports.createStore = async (req, res) => {

    const store = await (new Store(req.body)).save();

    //ES6 Promise way
    // store
    //     .save()
    //     .then(store => {
    //         res.json(store);
    //     })
    //     .catch(err => {
    //         throw Error(err);
    //     });

    ;
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    res.redirect(`/stores/${store.slug}`)
};

exports.getStores = async  (req, res) => {
    const stores = await Store.find();
    res.render('stores', {title: 'store', stores});
}
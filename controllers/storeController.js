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

exports.editStore = async  (req, res) => {
    const store = await Store.findOne({_id : req.params.id});
    res.render('editStore', {title: `Edit ${store.name}`, store});
}

exports.updateStore = async  (req, res) => {
    //set the location data to be a point
    req.body.location.type = 'Point';
    const store = await Store.findOneAndUpdate({_id : req.params.id}, req.body,
        {
            new : true,  //Return the new store instead of the old one
            runValidators: true,
        }).exec();
    req.flash('success', `Successfully updated <strong>${store.name}</strong> <a href="/stores/${store.slug}">View Store -></a>`);
    res.redirect(`/stores/${store._id}/edit`);
}
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const mongoose = require('mongoose');

const Store = mongoose.model('Store');
const User = mongoose.model('User');



const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next){
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto){
            next(null, true);
        }else{
            next({message: "That file type isn't allowed! "}, false);
        }
    }
};


module.exports.homepage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    //check if there is no new file to resize
    //multer sets the file property in the request
    if(!req.file){
        next(); //Skip to next middleware when there no photo provided
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    //now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    //once we have written the photo to our filesystem, keep going!
    next();
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
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
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;

    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({created : 'desc'});

    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit);

    if(!stores.length && skip){
        req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }
    res.render('stores', {title: 'store', stores, page, count, pages});
};

const confirmOwner = (store, user) => {
    if(!store.author.equals(user._id)){
        throw new Error('You must own a store in order to edit it!');
    }
}

exports.editStore = async  (req, res) => {
    const store = await Store.findOne({_id : req.params.id});
    confirmOwner(store, req.user);
    res.render('editStore', {title: `Edit ${store.name}`, store});
};

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
};

exports.getStoreBySlug = async(req, res) => {
    const store = await Store.findOne({slug: req.params.slug}).populate('author reviews');
    if(!store) return next(); // same as if(!store){ next(); return;}
    res.render('store', {store, title: store.name});

};

exports.getStoresByTag = async  (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || {$exists: true};
    const tagsPromise =  Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

    res.render('tags', {tags, title: 'Tags', tag, stores});
};

exports.searchStores = async (req, res) => {
    const stores = await Store
    .find({
        $text: {
            $search: req.query.q
        }
    },{
        score: {$meta: 'textScore'}
    })
    .sort({
        score: {$meta: 'textScore'}
    })

    //limit to only 5 results
    .limit(5);
    res.json(stores);
};

exports.mapStores = async ( req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);

    const q = {
        location: {
            $near: {
               $geometry:{
                   type: 'Point',
                   coordinates: coordinates
               },
               $maxDistance: 10000 //10km
            }
        }
    }
    //provide the property names that are need in .select. if we want some props not needed then .select('-author -tags')
    const stores = await Store.find(q).select('photo name location slug');
    res.json(stores);
};

exports.mapPage = (req, res) => {
    res.render('map', {title : 'Map'});
};

exports.getHearts = async (req, res) => {
    const stores = await Store.find({
        _id: {$in: req.user.hearts}
    });

    res.render('stores', {title: 'Hearted Stores', stores});
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id)? '$pull': '$addToSet';
    const user = await User
        .findByIdAndUpdate(req.user._id, {[operator] : {hearts: req.params.id}}, {new: true});

    res.json(user);
};

exports.getTopStores = async ( req, res) => {
    const stores = await Store.getTopStores();

    res.render('topStores', {stores, title: '★ Top Stores!'});

}
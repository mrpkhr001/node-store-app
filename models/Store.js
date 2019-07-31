const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: "Please enter a store name!",
    },
    slug: String,
    description: {
        type: String,
        trim: true,
    },
    tags: {
        type: [String]
    },
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }
        ],
        address: {
            type: String,
            required: 'You must supply an address'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    }
}
//Below option instructs serializer to populate the virtual fields like here 'reviews' in to Store object
// otherwise it will be hidden
,{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
}
);


//Indexing on store
storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({
    location: '2dsphere'
});

storeSchema.pre('save', async function (next) {
    if (!this.isModified('name')) {
        next();
        return;
    }
    this.slug = slug(this.name);
    // making more resilient so slugs are unique
    //Find other store with same slug
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storeWithSlug = await this.constructor.find({slug: slugRegEx});
    if(storeWithSlug.length){
        this.slug = `${this.slug}-${storeWithSlug.length  + 1}`;
    }
    next();

});

storeSchema.statics.getTagsList = function(){
    return this.aggregate([
        {$unwind: '$tags'},
        {$group: {_id: '$tags', count: {$sum: 1}}},
        {$sort: {count: -1}}
    ]).cursor({}).exec().toArray();
};

storeSchema.statics.getTopStores = function(){
    return this.aggregate([
        // Lookup Stores and populate their reviews
        {$lookup: {from: 'reviews', localField: '_id', foreignField: 'store', as : 'reviews'} },

        // filter for only items that have 2 or more reviews
        {$match: {'reviews.1': {$exists: true} } },

        // Add the average reviews field
        {$addFields: {
            averageRating: {$avg: '$reviews.rating'}
        }},

        // $project is older operator like $addFields in version v3.2 mongoDB, from v3.4 onwards $addFields is available
        // downside of $project is that it pipes output with single new field, to all required fields we need explicitly
        // like below with $$ROOT ( here we added photo, name, reviews)
        // {
        //     $project: {
        //         photo: '$$ROOT.photo',
        //         name: '$$ROOT.name',
        //         reviews: '$$ROOT.reviews',
        //         averageRating: {$avg: '$reviews.rating'}
        //     }
        // }

        // sort it by out rew field, highest reviews first
        {$sort: {averageRating: -1}},

        // limit to at most 10
        {$limit: 10}
    ]).cursor({}).exec().toArray();
};

//find reviews where the Stores _id property(below 'localField') === Reviews store property (below foreignField)
storeSchema.virtual('reviews', {
    ref: 'Review', //What model to link
    localField: '_id',  // which field on the store?
    foreignField: 'store' // which field on the review?
});

function autopopulate(next){
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);



module.exports = mongoose.model('Store', storeSchema);
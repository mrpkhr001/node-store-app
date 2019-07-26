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

//find reviews where the Stores _id property(below 'localField') === Reviews store property (below foreignField)
storeSchema.virtual('reviews', {
    ref: 'Review', //What model to link
    localField: '_id',  // which field on the store?
    foreignField: 'store' // which field on the review?
});

module.exports = mongoose.model('Store', storeSchema);
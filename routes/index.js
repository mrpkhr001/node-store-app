const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const {catchErrors} = require('../handlers/errorHandlers');

// Do work here
router.get('/', storeController.getStores);
router.get('/stores', storeController.getStores);
router.get('/add', storeController.addStore);


router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore));


router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore));

router.get(`/stores/:id/edit`, catchErrors(storeController.editStore));

router.get(`/stores/:slug`, catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
//Info: '/tags/:tag' can be used with regular express '/tags/:tag*?'
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

module.exports = router;

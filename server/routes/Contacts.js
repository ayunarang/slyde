const express= require('express')
const router=express.Router();

const { search , createRoom , getChatlist,getChatMessages, saveChatInDB} = require('../controllers/Contacts.js');


router.post('/search', search)
router.post('/room', createRoom)
router.get('/contactlist', getChatlist)
router.get('/chatMessages', getChatMessages)
router.post('/saveChat', saveChatInDB)


module.exports = router;
const express= require('express')
const router=express.Router();

const { login, register} = require('../controllers/Auth.js');



router.post('/login-user',login)


router.post('/signup-user', register)



module.exports = router;
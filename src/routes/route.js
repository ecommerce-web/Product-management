const express = require('express');
const router = express.Router();

const userController = require("../controllers/userController")
const middleware = require("../middlewares/auth")

router.get("/test-me", function(req, res){
    res.send({status : true, msg : "working"})
})

router.post("/register", userController.userProfile )

router.post("/login", userController.userLogin)

router.get("/user/:userId/profile",middleware.authentication, userController.getUserData)

router.put("/user/:userId/profile",  middleware.authentication, middleware.authorise, userController.updateUserProfile)

module.exports=router;

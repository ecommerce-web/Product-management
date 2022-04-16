const express = require('express');
const router = express.Router();

const userController = require("../controllers/userController")
const middleware = require("../middlewares/auth")
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")

router.get("/test-me", function(req, res){
    res.send({status : true, msg : "working"})
})


// user's APis
router.post("/register", userController.userProfile )

router.post("/login", userController.userLogin)

router.get("/user/:userId/profile",middleware.authentication, userController.getUserData)

router.put("/user/:userId/profile",  middleware.authentication, middleware.authorise, userController.updateUserProfile)


//Product APi's

router.post("/products", productController.productProfile )

router.get("/products", productController.filterProducts)

router.get("/products/:productId", productController.productDataById)

router.delete("/products/:productId", productController.deleteProductById)

router.put("/products/:productId", productController.updateProductDetails)


//cart API's

router.post("/users/:userId/cart", middleware.authentication, middleware.authorise , cartController.createCart)
router.put("/users/:userId/cart", cartController.updateCart)




module.exports=router;

const jwt = require("jsonwebtoken")

const userModel = require("../models/userModel")
const cartModel = require("../models/cartModel")
const mongoose = require("mongoose")

const isValid = function (value) {
    if (typeof value == "undefined" || value == null) return false
    if (typeof value == "string" && value == "undefined") return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'number' && value.toString().trim().length === 0) return false
    return true
}

const isValidObjectId = function (collegeId) {
    return mongoose.Types.ObjectId.isValid(collegeId)
}



const authentication = async function (req, res, next) {
    try {
        let token = req.headers['authorization']
        token = token.split(" ")
        // console.log(token[1])




        if (!token[1]) {
            return res.status(404).send({ status: false, msg: "token is not present in header" })
        }

        let decodeToken = jwt.verify(token[1], "Ronaldo-007")     //, {ignoreExpiration: true})
        // console.log(decodeToken)
        let exp = decodeToken.exp
        // console.log(exp)
        let iatNow = Math.floor(Date.now() / 1000)
        // console.log(iatNow)
        if (exp < iatNow) {
            return res.status(401).send({ status: false, msg: 'Token is expired now' })

        }


        req.decodeToken = decodeToken
        next()

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.messge })
    }
}

const authorise = async function (req, res, next) {
    try {

        userId = req.params.userId

        if (!isValid(userId)) {
            return res.status(400).send({ status: false, msg: "userid in path parms is not valid" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userid in path params is not a valid object id" })
        }


        if (userId !== req.decodeToken.userId) {
            return res.status(403).send({ status: false, msg: "user id does not matches with user credentials" })

        }
        next()


    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }

}

const authoriseInCart = async function (req, res, next) {
    try {
        userId1 = req.params.userId

        cartId = req.body.cartId

        if (!isValid(userId1)) {
            return res.status(400).send({ status: false, msg: "userid in path parms is not valid" })
        }

        if (!isValidObjectId(userId1)) {
            return res.status(400).send({ status: false, msg: "userid in path params is not a valid object id" })
        }

        
      

        if (userId1 != req.decodeToken.userId) {
            return res.status(403).send({ status: false, msg: "user id does not matches with user credentials" })

        }

        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, msg: "cart id in body is not valid" })
        }


        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "cart  is not a valid object id" })
        }

        
        const checkCartExist = await cartModel.findById(cartId)
       
        if (!checkCartExist) {
            return res.status(400).send({ status: false, msg: "cart does not exist for this cart id" })
        }



        if (userId1 != checkCartExist.userId) {
            return res.status(403).send({ status: false, msg: "you are trying to access someone else cart" })


        }

        next()
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })

    }
}



const getCartData = async function(req, res){
    try{
       const userId= req.params.userId

        if(!isValid(userId)){
            return res.status(400).send({status:false, msg : "wrong user id"})
        }

        if(!isValidObjectId(userId)){
            return res.status(400).send({status:false, msg:"user id is not a valid object id"})

        }

        const checkCartExist = await cartModel.findOne({userId})

        if(!checkCartExist){
            return res.status(400).send({status:false, msg : "cart does not exist for this user"})
        }

        return res.status(200).send({status:true, msg : "here is your cart summary", data : checkCartExist})


    

    }catch(err){
        return res.status(500).send({status:false, msg:err.message})
    }
}

module.exports.authentication = authentication
module.exports.authorise = authorise
module.exports.authoriseInCart = authoriseInCart
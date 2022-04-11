const jwt = require("jsonwebtoken")

const userModel = require("../models/userModel")


const authentication = async function(req, res ,next){
    try {
        let token = req.headers["x-api-key"]
        if (!token) {
            return res.status(404).send({ status: false, msg: "token is not present in header" })
        }

        let decodeToken = jwt.verify(token, "Ronaldo-007")     //, {ignoreExpiration: true})
        let exp = decodeToken.exp
        let iatNow = Math.floor(Date.now() / 1000)
        if(exp<iatNow) {
            return res.status(401).send({status:false,msg:'Token is expired now'})

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
        if (userId) {
            if (userId !== req.decodeToken.userId) {
                return res.status(403).send({ status: false, msg: "user id does not matches with user credentials" })

            }
            next()
        }

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }

}


module.exports.authentication=authentication
module.exports.authorise=authorise
const cartModel = require("../models/cartModel")
const mongoose = require("mongoose")

const productModel = require("../models/productModel")
const userModel = require("../models/userModel")
const vary = require("vary")
const { remove } = require("../models/cartModel")




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


const createCart = async function (req, res) {
    try {

        let id = req.params.userId
        let data = req.body
        // console.log(data)


        // check id in params is valid or not
        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, msg: "user Id in params is not in valid format" })
        }


        // check body is there
        if (Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "body is missing" })
        }


        let obj = {}


        const { userId, items, totalPrice, totalItems } = data /// destructuring the whole data inside body

        // userId Validations

        if (!isValid(userId)) {
            return res.status(400).send({ status: false, msg: "usrID is not correct" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "user Id is not in valid format" })
        }

        const usersCartAlreadyExist = await cartModel.findOne({ userId: userId })
        
        
        if (usersCartAlreadyExist) {
            
            if (!Array.isArray(items)) {
                return res.status(400).send({ status: false, msg: "items is not an array" })
            }
            if (!isValid(items[0].productId)) {
                return res.status(400).send({ status: false, msg: "product is not valid" })
            }
            if (!isValidObjectId(items[0].productId)) {
                return res.status(400).send({ status: false, msg: "product is not a valid object id" })
            }

            var price = await productModel.findOne({_id:items[0].productId, isDeleted:false})
            if(!price){
                return res.status(400).send({status:false, msg : "Product not in stock right now"})
            }


            for (let i = 0; i < usersCartAlreadyExist.items.length; i++) {
                if (items[0].productId == usersCartAlreadyExist.items[i].productId) {
                    let idOfArray = usersCartAlreadyExist.items[i]._id
                    
                   
                    
                    const updateCart = await cartModel.findOneAndUpdate(
                        { _id: usersCartAlreadyExist._id, "items._id": idOfArray },
                        { $inc: { "items.$.quantity": 1,  totalPrice: price.price } },

                        { new: true }


                    )
                    return res.status(200).send({ status: true, msg: "cart updated", data: updateCart })


                }
            }


           
            const updatePrice = await cartModel.findOneAndUpdate(
                { userId: userId} ,
                {$inc: { totalPrice: price.price, totalItems: 1 } ,
              
                 $push: { items: { productId: items[0].productId, quantity: 1 } } },
               
                {new:true}
               
                
            )
            return res.status(200).send({ status: true, msg: "cart updated", data: updatePrice })



        } else {
            obj.userId = userId


            //items validation

            if (!Array.isArray(items)) {
                return res.status(400).send({ status: false, msg: "items is not an array" })
            }
            if (!isValid(items[0].productId)) {
                return res.status(400).send({ status: false, msg: "product is not valid" })
            }
            if (!isValidObjectId(items[0].productId)) {
                return res.status(400).send({ status: false, msg: "product is not a valid object id" })
            }

           

            var price = await productModel.findOne({_id:items[0].productId, isDeleted:false})
            if(!price){
                return res.status(400).send({status:false, msg : "Product not in stock right now"})
            }

            obj.items = []

            obj.items.push({ productId: items[0].productId })
           

            obj.items[0].quantity = 1

            // console.log(items)

            // const price = await productModel.findById(items[0].productId)

            obj.totalPrice = Number(price.price)

            obj.totalItems = 1


            const cartData = await cartModel.create(obj)

            return res.status(200).send({ status: true, msg: "cart Created", data: cartData })


        }
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}



const updateCart = async function(req, res){
    try{
        const userId = req.params.userId
        const data = req.body

         // check id in params is valid or not
       

        // check body is there
        if (Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "body is missing" })
        }
        
        const{cartId , productId, removeProduct}= data


        

        const checkCartExist = await cartModel.findById(cartId)
        if(!checkCartExist){
            return res.status(400).send({status:false, msg : "cart does not exist for this cart id"})
        }

      

        // validations on productId

        if(!isValid(productId)){
            return res.status(400).send({status:false, msg : "wrong vlue of product id"})
        }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "product Id is not in valid format" })
        }

        const productExist = await productModel.findOne({_id : productId, isDeleted:false})
        if(!productExist){
            return res.status(400).send({status:false, msg : "product you want to update does not exist in our system"})
        }

        // remove product validations

        if(!isValid(removeProduct)){
            return res.status(400).send({ status: false, msg: "remove product is not in valid format" })

        }

       
        if(removeProduct !== 0 && removeProduct !== 1){
            return res.status(400).send({status:false, msg:"remove proiduct would take only 0 and 1"})
        }

        let flag=false

        for(let i = 0 ; i<checkCartExist.items.length; i++){
            if(checkCartExist.items[i].productId == productId){
                var qt = checkCartExist.items[i].quantity
                var idOfArray= checkCartExist.items[i]._id
                flag=true
                
                break
            }
        
        }

        if(flag=== false){
            return res.status(400).send({status : false, msg : "the product you want to update does not exist in the cart"})
        }

        if(removeProduct === 0){

           

            let totalAmountReduced = qt *(productExist.price)
           

            const changeInCart = await cartModel.findOneAndUpdate(
                {_id: cartId},
                {$inc : {totalPrice : -totalAmountReduced, totalItems:-1}, $pull : {items : {productId :productId}}},
                {new:true}

            )

            return res.status(400).send({status:false, msg:"product removed from the cart", data:changeInCart})

        }else{
            if(qt > 1){
                const changeInCart = await cartModel.findOneAndUpdate(
                    {_id:cartId,  "items._id": idOfArray},
                    {$inc : {'items.$.quantity': -1, totalPrice : -productExist.price}},
                    {new:true}
                )

                return res.status(400).send({status:false, msg : "Qunatity decreased from the cart", data: changeInCart})
            }else{
                const changeInCart = await cartModel.findOneAndUpdate(
                    {_id: cartId},
                    {$inc : {totalPrice :-productExist.price, totalItems:-1}, $pull : {items : {productId :productId}}},
                    {new:true}
    
                )
                return res.status(400).send({status:false, msg : "Qunatity decreased from the cart", data: changeInCart})

            }

        }
    }catch(err){
        return res.status(500).send({status: false, msg:err.message})
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



const deleteCart = async function(req, res){
    try{
        userId = req.params.userId

        if(!isValid(userId)){
            return res.status(400).send({status:false, msg : "wrong user id"})
        }

        if(!isValidObjectId(userId)){
            return res.status(400).send({status:false, msg:"user id is not a valid object id"})

        }

        const checkCartExist = await cartModel.findOneAndUpdate(
            {userId:userId},
            {$set : {items : [] , totalItems:0, totalPrice:0}},
            {new:true}
        )

        if(!checkCartExist){
            return res.status(400).send({status:false, msg : "cart does not exist for this user"})
        }

        return res.status(200).send({status:false, msg : "cart deleted", data:checkCartExist})





    }catch(err){
        return res.status(500).send({status:false, msg : err.message})
    }
}



module.exports.createCart = createCart
module.exports.updateCart=updateCart
module.exports.getCartData=getCartData
module.exports.deleteCart=deleteCart

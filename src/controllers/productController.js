const removeUploadedFiles = require('multer/lib/remove-uploaded-files');
const aws = require("aws-sdk");
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")

const productModel = require("../models/productModel");
// const { address } = require('ip');

const bcrypt = require("bcrypt");
const { fn } = require('moment');
const { address } = require('ip');
const { RFC_2822 } = require('moment');

aws.config.update(
    {
        accessKeyId: "AKIAY3L35MCRVFM24Q7U",
        secretAccessKey: "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",
        region: "ap-south-1"
    }
)

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        //this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: "2006-03-01" }) //we will be using s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket", // HERE
            Key: "user/" + file.originalname, // HERE "radhika/smiley.jpg"
            Body: file.buffer
        }

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log(" file uploaded succesfully ")
            return resolve(data.Location) // HERE
        }
        )

    }
    )
}

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

const isENum = function (value) {
    console.log(value)
    for (let i = 0; i < value.length; i++) {
        if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(value[i]) === -1) {
            return false
        }
    }

    return true

}


const productProfile = async function (req, res) {
    try {

        let files = req.files
        let data = req.body

        if (files && files.length > 0 && Object.keys(data).length > 0) {


            let obj = {}

            let { title, description, price, currencyId, currencyFormat, style, availableSizes, installments } = data


            // title validation

            if (!isValid(title)) {
                return res.status(400).send({ status: false, msg: "title is not valid" })
            }

            const istitlealredyUsed = await productModel.findOne({ title }) //{email :email} object shorthand property
            //console.log(isEmailalredyUsed)
            if (istitlealredyUsed) {
                return res.status(400).send({ status: false, msg: "title already in use" })

            }

            obj.title = title.trim().toLowerCase()



            //description validation

            if (!isValid(description)) {
                return res.status(400).send({ status: false, msg: "description is not valid" })
            }

            obj.description = description.toLowerCase().trim()

            //price

            if (!isValid(price)) {
                return res.status(400).send({ status: false, msg: "price is not valid" })
            }

            obj.price = price

            //currencyId
            if (currencyId) {
                if (!isValid(currencyId) || currencyId !== "INR") {
                    return res.status(400).send({ status: false, msg: "currency id is not valid" })
                }

                obj.currencyId = "INR"
            }


            // currencyFormat
            if (currencyFormat) {
                if (!isValid(currencyFormat) || currencyFormat !== "₹") {
                    return res.status(400).send({ status: false, msg: "currency formt is not valid" })

                }
                obj.currencyFormat = "₹"
            }

            //style validtion

            if (style) {
                if (!isValid(style)) {
                    return res.status(400).send({ status: false, msg: "style is not in valid format" })
                }

                obj.style = style.toLowerCase().trim()
            }

            if (installments) {
                if (!isValid(installments)) {
                    return res.status(400).send({ status: false, msg: "installments is not in valid format" })
                }

                obj.installments = installments.toLowerCase().trim()
            }







            //avaialbale sizes

            console.log(obj)

            if (!isValid(availableSizes)) {
                return res.status(400).send({ status: false, msg: "availableSizes is not in valid format" })

            }

            if (!isENum(availableSizes)) {
                return res.status(400).send({ status: false, msg: "size value is out of index" })
            }

            obj.availableSizes = availableSizes


            //installments validtion
            if (installments) {
                if (!isValid(installments)) {
                    return res.status(400).send({ status: false, msg: "installment is not valid" })
                }

                obj.installments = installments

            }



            let fileFormat = files[0].mimetype.split('/')

            if (fileFormat.indexOf('image') === -1) {
                return res.status(400).send({ status: false, msg: "you can only upload jpg/png/jpeg types of file" })
            }


            let uploadFileUrl = await uploadFile(files[0])

            // let isimgeLinkUnique = await productModel.findOne({ profileImage: uploadFileUrl })
            // if (isimgeLinkUnique) {
            //     return res.status(400).send({ status: false, msg: "image already in use" })
            // }

            obj.productImage = uploadFileUrl

            const productCreated = await productModel.create(obj)

            return res.status(201).send({ status: true, msg: "product Created", data: productCreated })



        } else {
            return res.status(400).send({ status: false, msg: "either image pic or body is missing" })
        }

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}



const filterProducts = async function (req, res) {
    try {
        data = req.query
        const obj = {}
        obj.isDeleted = false

        if (Object.keys(data).length === 0) {

            const productData = await productModel.find({ isDeleted: false })

            if (productData.length === 0) {
                return res.status(404).send({ status: false, msg: "no book found" })
            }

            return res.status(200).send({ status: true, msg: "products", data: productData })

        }


        var { size, name, priceGreaterThan, priceLessThan } = data

        if (isValid(size)) {
            obj.availableSizes = size.toUpperCase()
        }

        if (isValid(name)) {
            obj.title = {$regex : name, $options:"$i"}


        }
        console.log(obj)




        if (isValid(priceGreaterThan) && isValid(priceLessThan)) {
            priceGreaterThan = Number(priceGreaterThan)
            priceLessThan = Number(priceLessThan)

            if (priceLessThan < priceGreaterThan) {
                return res.status(400).send({ status: false, msg: "wrong filter value in price" })
            }

            obj.price = { $gte: priceGreaterThan, $lte: priceLessThan }
            

        }else if (isValid(priceLessThan)) {
            priceLessThan = Number(priceLessThan)
            obj.price = {}
            obj.price.$lte = priceLessThan
        }else if (isValid(priceGreaterThan)) {
            priceGreaterThan = Number(priceGreaterThan)
            obj.price = {}
            obj.price.$gte = priceGreaterThan
        }

        obj.isDeleted = false

       




        const dataByFilter = await productModel.find(obj)

        if (dataByFilter.length === 0) {
            return res.status(404).send({ status: false, msg: "Nothing found, pls change your filter values" })

        }


        return res.status(200).send({ status: true, msg: "below are the mentioned products for your filters", data: dataByFilter })


    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })

    }
}



const productDataById = async function (req, res) {
    try {

        id = req.params.productId
        // console.log(id)

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, msg: "product id is not valid" })
        }

        const data = await productModel.findOne({ _id: id, isDeleted: false })
        // console.log(data)

        if (!data) {
            return res.status(400).send({ status: false, msg: "no product exist with this id" })
        }

        return res.status(200).send({ status: false, msg: "product detail", data: data })


    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}


const deleteProductById = async function (req, res) {
    try {

        id = req.params.productId
        // console.log(id)

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, msg: "product id is not valid" })
        }

        const data = await productModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true, deletedAt: Date.now() } }
        )

        if (!data) {
            return res.status(400).send({ status: false, msg: "product is already deleted or not exist in our system" })
        }

        return res.status(200).send({ status: false, msg: "product deleted" })


    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}




const updateProductDetails = async function (req, res) {
    try {

        productId = req.params.productId
        let files = req.files
        let data = req.body

        console.log(data)

        
        if (!files && Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "Nothing to update" })
        }


        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "user Id is not Valid" })
        }


        let obj = {}

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data


        //title validation
        if (title) {
            if (!isValid(title)) {
                return res.status(400).send({ status: false, msg: "title is not valid" })
            }

            const isTitleUnique = await productModel.find({ title: title })
            console.log(isTitleUnique)
            if (isTitleUnique.length > 0) {
                return res.status(400).send({ status: false, msg: "title alredy exist" })
            }

            obj.title = title.toLowerCase()
        }

        // description validation
        if (description) {
            if (!isValid(description)) {
                return res.status(400).send({ status: false, msg: "description is not valid" })
            }

            obj.description = description.toLowerCase()
        }

        // price validation

        if (price) {
            if (!isValid(price)) {
                return res.status(400).send({ status: false, msg: "price is not valid" })
            }

            if(!Number(price)){
                return res.send({msg:"error"})
            }

            if(Number(price)>0){
                re
            }

            obj.price = Number(price)
        }


        if (currencyId) {
            if (!isValid(currencyId)) {
                return res.status(400).send({ status: false, msg: "currencyId is not valid" })
            }

            obj.currencyId = currencyId
        }

        if (currencyFormat) {
            if (!isValid(currencyFormat)) {
                return res.status(400).send({ status: false, msg: "currenct format is not valid" })
            }

            obj.currencyFormat = currencyFormat
        }


        if (isFreeShipping) {
            if (!isValid(isFreeShipping)) {

                return res.status(400).send({ status: false, msg: "isFreeshipping is not valid" })
            }

            if (isFreeShipping !== "true" || isFreeShipping !== "false") {
                return res.status(400).send({ status: false, msg: "isFreeshipping is take only true or false" })
            }

            obj.isFreeShipping = isFreeShipping
        }


        if (style) {
            if (!isValid(style)) {
                return res.status(400).send({ status: false, msg: "style is not valid" })
            }

            obj.style = style
        }


        if (availableSizes) {
            if (!isValid(availableSizes)) {
                return res.status(400).send({ status: false, msg: "available sizes is not valid" })
            }

            // let size=availableSizes.toUpperCase()

            for(let i = 0 ; i<availableSizes.length; i++){
                availableSizes[i]=availableSizes[i].toUpperCase()
            }

            if (!isENum(availableSizes)) {
                return res.status(400).send({ status: false, msg: "available size is not correct" })

            }



            obj.availableSizes = availableSizes
        }


        if (installments) {
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, msg: "installments is not valid" })
            }

            obj.installments = installments
        }

        if (files && files.length > 0) {
            // console.log("hi")
            let fileFormat = files[0].mimetype.split('/')

            if (fileFormat.indexOf('image') === -1) {
                return res.status(400).send({ status: false, msg: "you can only upload jpg/png/jpeg types of file" })
            }


            let uploadFileUrl = await uploadFile(files[0])

            let isimgeLinkUnique = await productModel.findOne({ profileImage: uploadFileUrl })
            if (isimgeLinkUnique) {
                return res.status(400).send({ status: false, msg: "image already in use" })
            }

            obj.productImage = uploadFileUrl


        }

        console.log(obj)

      

        if (Object.keys(obj).length == 0) {
            return res.status(400).send({ status: false, msg: "Nothing to update" })
        }

        const update = await productModel.findOneAndUpdate(
            { _id: productId, isDeleted: false },
            { $set: obj },
            { new: true }
        )

        if (!update) {
            return res.status(400).send({ status: false, msg: "product does not exist or deleted" })
        }

        return res.status(200).send({ status: false, msg: "updated", data: update })



    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}






module.exports.productProfile = productProfile
module.exports.filterProducts = filterProducts
module.exports.productDataById = productDataById
module.exports.updateProductDetails = updateProductDetails
module.exports.deleteProductById = deleteProductById
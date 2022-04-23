
const mongoose = require("mongoose")
const getSymbolFromCurrency = require('currency-symbol-map')

const productModel = require("../models/productModel");

const bcrypt = require("bcrypt");
let aws = require("../awsConfiguration/aws")



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

        if (!files > 0 && Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "either image or body is missing" })

        }


        let obj = {}

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data


        // title validation

        if (!isValid(title)) {
            return res.status(400).send({ status: false, msg: "title is not valid" })
        }

        const istitlealredyUsed = await productModel.findOne({ title }) //{email :email} object shorthand property

        if (istitlealredyUsed) {
            return res.status(400).send({ status: false, msg: "title already in use" })

        }

        obj.title = title.trim().toLowerCase()



        //description validation

        if (!isValid(description)) {
            return res.status(400).send({ status: false, msg: "description is not valid" })
        }

        obj.description = description.toLowerCase().trim()

        //price  valiadtion

        if (!isValid(price)) {
            return res.status(400).send({ status: false, msg: "price is not valid" })
        }

        if (isNaN(Number(price)) === true) {
            return res.status(400).send({ status: false, msg: "Price would take only Numbers as a input" })
        }

        price = Number(price)

        if (price <= 0) {
            return res.status(400).send({ status: false, msg: "Price value can't be less than 1" })
        }

        obj.price = price


        //currencyId validation nd check


        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, msg: "currency id is not valid" })
        }

        let validateCurrencyId = getSymbolFromCurrency(currencyId)

        if (!validateCurrencyId) {
            return res.status(400).send({ status: false, msg: "currency id is wrong" })
        }

        obj.currencyId = currencyId



        // currencyFormat
        if (currencyFormat) {
            if (!isValid(currencyFormat)) {
                return res.status(400).send({ status: false, msg: "currency format is not valid" })

            }
            if (currencyFormat !== validateCurrencyId) {
                return res.status(400).send({ status: false, msg: "pls provide valid currencyFormat" })
            }
        }

        obj.currencyFormat = validateCurrencyId


        //isFreeShipping validation

        if (isFreeShipping) {
            if (!isValid(isFreeShipping)) {
                return res.status(400).send({ status: false, msg: "isFreeshipping value is take only true or false vlue" })
            }

            if (isFreeShipping !== "true" || isFreeShipping !== "false") {
                return res.status(400).send({ status: false, msg: `${isFreeShipping} worng value.IsFreeShipping would take only true and false.` })
            }

            obj.isFreeShipping = isFreeShipping
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
            if (isNaN(Number(price)) === true) {
                return res.status(400).send({ status: false, msg: "Price would only Numbers as a input" })
            }

            price = Number(price)

            obj.installments = installments
        }








        //avaialbale sizes

        if (!isValid(availableSizes)) {
            return res.status(400).send({ status: false, msg: "available sizes is not in valid format" })

        }
        if (Array.isArray(availableSizes)) {
            for (let i = 0; i < availableSizes.length; i++) {

                availableSizes[i] = availableSizes[i].toUpperCase().trim()
                if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizes[i]) === -1) {
                    return res.status(400).send({ status: false, msg: `${availableSizes[i]} wrong value. It must belong among them ["S", "XS","M","X", "L","XXL", "XL"]` })

                }

                obj.availableSizes = availableSizes
            }

            
        } else {
            availableSizes = availableSizes.toUpperCase()
            if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizes) === -1) {
                return res.status(400).send({ status: false, msg: `${availableSizes} wrong value.It must belong among them ["S", "XS","M","X", "L","XXL", "XL"]` })

            }

            obj.availableSizes = availableSizes

        }


        //installments validtion
        if (installments) {
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, msg: "installment is not valid" })
            }

            obj.installments = installments

        }


        if (files.length === 0) {
            return res.status(400).send({ status: false, msg: "Product image is missing" })
        }

        let fileFormat = files[0].mimetype.split('/')

        if (fileFormat.indexOf('image') === -1) {
            return res.status(400).send({ status: false, msg: "you can only upload jpg/png/jpeg types of file" })
        }

        //uplod to s3 and return true..incase of error in uploading this will go to catch block(as rejected promise) 
        let uploadFileUrl = await aws.uploadFile(files[0]) //  expect this function to take file as input and give s3 url of of our image 
        obj.productImage = uploadFileUrl

        const productCreated = await productModel.create(obj)

        return res.status(201).send({ status: true, msg: "product Created", data: productCreated })




    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}



const filterProducts = async function (req, res) {
    try {
        const data = req.query
        let obj = {}
        let sortByPrice = {}

        obj.isDeleted = false



        let { size, name, priceGreaterThan, priceLessThan, priceSort } = data


        if (isValid(size)) {
            if (Array.isArray(size)) {
                for (let i = 0; i < size.length; i++) {

                    size[i] = size[i].toUpperCase().trim()
                    if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(size[i]) === -1) {
                        return res.status(400).send({ status: false, msg: `${size[i]} wrong value. It must belong among them ["S", "XS","M","X", "L","XXL", "XL"]` })

                    }
                }

                obj.availableSizes = { $in: size }
            } else {
                size = size.toUpperCase()
                if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizes) === -1) {
                    return res.status(400).send({ status: false, msg: `${availableSizes} wrong value.It must belong among them ["S", "XS","M","X", "L","XXL", "XL"]` })
    
                }
    

                obj.availableSizes = { $in: size }

            }
        }





        if (isValid(name)) {
            obj.title = { $regex: name, $options: "$i" }
        }




        if (isValid(priceGreaterThan) && isValid(priceLessThan)) {
            priceGreaterThan = Number(priceGreaterThan)
            priceLessThan = Number(priceLessThan)

            if (priceLessThan < priceGreaterThan) {
                return res.status(400).send({ status: false, msg: "wrong filter value in price" })
            }

            obj.price = { $gte: priceGreaterThan, $lte: priceLessThan }


        } else if (isValid(priceLessThan)) {
            priceLessThan = Number(priceLessThan)
            obj.price = {}
            obj.price.$lte = priceLessThan
        } else if (isValid(priceGreaterThan)) {
            priceGreaterThan = Number(priceGreaterThan)
            obj.price = {}
            obj.price.$gte = priceGreaterThan
        }

        if (priceSort) {
            if (!isValid(priceSort)) {
                return res.status(400).send({ status: false, msg: "price sort is not in valid format" })
            }
            if (isNaN(Number(priceSort)) === true) {
                return res.status(400).send({ status: false, msg: "Price sort would take only Numbers as a input -1 or 1" })
            }

            priceSort = Number(priceSort)

            if ([1, -1].indexOf(priceSort) === -1) {
                return res.status(400).send({ status: false, msg: `${priceSort} is wrong value.It will take -1 or 1` })

            }

            sortByPrice.price = priceSort
        }

        let dataByFilter = await productModel.find(obj).sort(sortByPrice)

        if (dataByFilter.length === 0) {
            return res.status(400).send({ status: false, msg: "Nothing is found, pls try another filter value" })
        }



        return res.status(200).send({ status: false, msg: "your result as per your request", data: dataByFilter })



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

        if (!files && Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "Nothing to update" })
        }


        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: " Id is not Valid" })
        }




        let obj = {}

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data


        //title validation
        if (title) {
            if (!isValid(title)) {
                return res.status(400).send({ status: false, msg: "title is not valid" })
            }

            const isTitleUnique = await productModel.find({ title: title })

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

            if (!Number(price)) {
                return res.status(400).send({ status: false, msg: "Price should be in valid format" })
            }

            if (Number(price) <= 0) {
                return res.status(400).send({ status: false, msg: "Price should be greater than 0" })
            }

            obj.price = Number(price)
        }


        if (currencyId) {
            if (!isValid(currencyId)) {
                return res.status(400).send({ status: false, msg: "currencyId is not valid" })
            }

            const validateCurrencyId = getSymbolFromCurrency(currencyId)

            if (!validateCurrencyId) {
                return res.status(400).send({ status: false, msg: "currency id is wrong" })
            }

            obj.currencyId = currencyId

        }

        if (currencyFormat) {
            if (!isValid(currencyFormat)) {
                return res.status(400).send({ status: false, msg: "currenct format is not valid" })
            }

            if (currencyFormat !== validateCurrencyId) {
                return res.status(400).send({ status: false, msg: "currency format is not valid" })
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
                return res.status(400).send({ status: false, msg: "available sizes is not in valid format" })
    
            }
            if (Array.isArray(availableSizes)) {
                for (let i = 0; i < availableSizes.length; i++) {
    
                    availableSizes[i] = availableSizes[i].toUpperCase().trim()
                    if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizes[i]) === -1) {
                        return res.status(400).send({ status: false, msg: `${availableSizes[i]} wrong value. It must belong among them ["S", "XS","M","X", "L","XXL", "XL"]` })
    
                    }
    
                    obj.availableSizes = availableSizes
                }
    
                
            } else {
                availableSizes = availableSizes.toUpperCase()
                if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizes) === -1) {
                    return res.status(400).send({ status: false, msg: `${availableSizes} wrong value.It must belong among them ["S", "XS","M","X", "L","XXL", "XL"]` })
    
                }
    
                obj.availableSizes = availableSizes
    
            }
        
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


            let uploadFileUrl = await aws.uploadFile(files[0])

            // let isimgeLinkUnique = await productModel.findOne({ profileImage: uploadFileUrl })
            // if (isimgeLinkUnique) {
            //     return res.status(400).send({ status: false, msg: "image already in use" })
            // }

            obj.productImage = uploadFileUrl


        }


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
const removeUploadedFiles = require('multer/lib/remove-uploaded-files');
const aws = require("aws-sdk");
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")

const userModel = require("../models/userModel");
// const { address } = require('ip');

const bcrypt = require("bcrypt");
const { fn } = require('moment');
const { address } = require('ip');

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







const userProfile = async function (req, res) {
    try {

        let files = req.files
        let data = req.body

        if (files && files.length > 0 && Object.keys(data).length > 0) {

            let obj = {}

            let { fname, lname, email, phone, password, address } = data
            


            // userName validation

            if (!isValid(fname)) {
                return res.status(400).send({ status: false, msg: "first name is not valid" })
            }

            obj.fname = fname


            if (!isValid(lname)) {
                return res.status(400).send({ status: false, msg: "last name is not valid" })
            }

            obj.lname = lname

            //email validtion -------------------------------------------------------  

            if (!isValid(email)) {
                return res.status(400).send({ status: false, msg: "first name is not valid" })
            }

            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, msg: "Email should be valid email address" })
            }

            const isEmailalredyUsed = await userModel.findOne({ email }) //{email :email} object shorthand property
            if (isEmailalredyUsed) {
                return res.status(400).send({ status: false, msg: "email already in use" })

            }

            obj.email = email


            // phone number validaation ------------------------------------------------


            if (!isValid(phone)) {
                return res.status(400).send({ status: false, msg: "phone is not valid/phone is missing" })
            }

            if (phone.length != 10) {
                return res.status(400).send({ status: false, msg: "phone length needs to be of 10 digit" })
            }

            if (!/^[6-9]{1}[0-9]{9}$/.test(phone)) {
                return res.status(400).send({ status: false, msg: "phone should be valid phone number" })
            }

            let isphonealreadyused = await userModel.findOne({ phone })
            if (isphonealreadyused) {
                return res.status(400).send({ status: false, msg: "phone number is already in use" })
            }

            obj.phone = phone


            //password validation  and encryption----------------------------------------------------

            if (!isValid(password)) {
                return res.status(400).send({ status: false, msg: "password is not valid/password is missing" })
            }

            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, msg: "passowrd min length is 8 and max len is 15" })
            }

            const securePassword = await bcrypt.hash(password, 10);

            obj.password = securePassword


            // address validation -----------------------------------------------------


            if (!isValid(address)) {
                return res.status(400).send({ status: false, msg: "Address is not valid" })

            }

            address = JSON.parse(address)

            let { shipping, billing } = address

            // shipping address ------------------------------------------------------

            if (!isValid(shipping)) {
                return res.status(400).send({ status: false, msg: "Shipping Address is not valid" })

            }

            if (!isValid(shipping.street)) {
                return res.status(400).send({ status: false, msg: "Shipping street is not valid" })

            }
            if (!isValid(shipping.city)) {
                return res.status(400).send({ status: false, msg: "Shipping city is not valid" })

            }
            if (!isValid(shipping.pincode)) {
                return res.status(400).send({ status: false, msg: "Shipping pincode is not valid" })

            }
            if (!/^[1-9][0-9]{5}$/.test(shipping.pincode)) {
                return res.status(400).send({ status: false, msg: "Shipping pincode is not valid number" })
            }

            obj.address = { shipping, billing }

            obj.address.shipping.street = shipping.street
            obj.address.shipping.city = shipping.city
            obj.address.shipping.pincode = shipping.pincode




            // billing address
            if (!isValid(billing)) {
                return res.status(400).send({ status: false, msg: "Billing Address is not valid" })

            }

            if (!isValid(billing.street)) {
                return res.status(400).send({ status: false, msg: "billing street is not valid" })

            }
            if (!isValid(billing.city)) {
                return res.status(400).send({ status: false, msg: "billing city is not valid" })

            }
            if (!isValid(billing.pincode)) {
                return res.status(400).send({ status: false, msg: "billing pincode is not valid" })

            }
            if (!/^[1-9][0-9]{5}$/.test(billing.pincode)) {
                return res.status(400).send({ status: false, msg: "billing pincode is not valid number" })
            }

            obj.address.billing.street = billing.street
            obj.address.billing.city = billing.city
            obj.address.billing.pincode = billing.pincode




            // files validation(image validation)

            let fileFormat = files[0].mimetype.split('/')

            if (fileFormat.indexOf('image') === -1) {
                return res.status(400).send({ status: false, msg: "you can only upload jpg/png/jpeg types of file" })
            }

            let uploadFileUrl = await uploadFile(files[0])

            let isimgeLinkUnique = await userModel.findOne({ profileImage: uploadFileUrl })
            if (isimgeLinkUnique) {
                return res.status(400).send({ status: false, msg: "image already in use" })
            }

            obj.profileImage = uploadFileUrl

            const userCreated = await userModel.create(obj)

            return res.status(201).send({ status: true, msg: "user Created", data: userCreated })



        } else {
            return res.status(400).send({ status: false, msg: "either image pic or body is missing" })
        }


    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }

}


const userLogin = async function (req, res) {
    try {
        let data = req.body

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "body is missing" })
        }
        const { email, password } = data

        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "email is not valid" })
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, msg: "Email should be valid email address" })
        }


        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "password is missing" })
        }

        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, msg: "password length should be in between 8 to 15" })
        }

        const checkEmailExist = await userModel.findOne({ email })
        if (!checkEmailExist) {
            return res.status(401).send({ status: false, msg: "email is wrong" })
        }

        let encodedPassword = checkEmailExist.password

        const checkPassWord = await bcrypt.compare(password, encodedPassword)

        if (checkPassWord) {
            let token = jwt.sign(
                {
                    userId: checkEmailExist._id,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60

                },
                "Ronaldo-007"
            )

            res.setHeader("x-api-token", token)
            res.status(200).send({ status: true, msg: "User login successful", data: { userId: checkEmailExist._id, token: token } })

        } else {
            return res.status(401).send({ status: false, msg: "password is not correct" })
        }

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}


const getUserData = async function (req, res) {
    try {

        const userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "user id is not in valid format" })
        }

        const userData = await userModel.findById({ _id: userId })
        if (!userId) {
            return res.status(404).send({ status: true, msg: "no user found with this id" })
        }

        return res.status(200).send({ status: false, msg: "User profile details", data: userData })



    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}




const updateUserProfile = async function (req, res) {
    try {

        userId = req.params.userId
        let files = req.files
        let data = req.body


        if (!files && Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "Nothing to update" })  // needs to hndle this
        }


        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "user Id is not Valid" })
        }


        let obj = {}

        var { fname, lname, email, phone, password, address } = data
        console.log(address)

        if (fname) {
            if (!isValid(fname)) {
                return res.status(400).send({ status: false, msg: " first Nme is not valid" })
            }

            obj.fname = fname

        }

        if (lname) {
            if (!isValid(lname)) {
                return res.status(400).send({ status: false, msg: " last Name is not valid" })
            }
            obj.lname = lname
        }

        if (email) {

            if (!isValid(email)) {
                return res.status(400).send({ status: false, msg: "first name is not valid" })
            }

            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, msg: "Email should be valid email address" })
            }

            const isEmailalredyUsed = await userModel.findOne({ email }) //{email :email} object shorthand property
            //console.log(isEmailalredyUsed)
            if (isEmailalredyUsed) {
                return res.status(400).send({ status: false, msg: "email already in use" })

            }

            obj.email = email

        }

        if (phone) {
            if (!/^[6-9]{1}[0-9]{9}$/.test(phone)) {
                return res.status(400).send({ status: false, msg: "phone should be valid phone number" })
            }

            let isphonealreadyused = await userModel.findOne({ phone })
            if (isphonealreadyused) {
                return res.status(400).send({ status: false, msg: "phone number is already in use" })
            }

            obj.phone = phone

        }

        if (password) {
            if (!isValid(password)) {
                return res.status(400).send({ status: false, msg: "password is not valid/password is missing" })
            }

            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, msg: "passowrd min length is 8 and max len is 15" })
            }

            const securePassword = await bcrypt.hash(password, 10);
            obj.password = securePassword

        }


        if (address) {
            let { shipping, billing } = address
            obj.address = {}
            // console.log(obj)

            if (shipping) {
                obj.address.shipping = {}
                // console.log(address.shipping)


                if (address.shipping.street) {
                    if (!isValid(address.shipping.street)) {
                        return res.status(400).send({ status: false, msg: "shipping street is not valid" })
                    }
                    obj.address.shipping.street = address.shipping.street
                    var shippingStreet = address.shipping.street
                }
                if (address.shipping.city) {
                    if (!isValid(address.shipping.city)) {
                        return res.status(400).send({ status: false, msg: "shipping city is not valid" })
                    }
                    obj.address.shipping.city = address.shipping.city
                    var shippingCity = address.shipping.city
                }
                if (address.shipping.pincode) {
                    if (!isValid(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, msg: "shipping pincode is not valid" })
                    }
                    obj.address.shipping.pincode = address.shipping.pincode
                    var shippingpincode = address.shipping.pincode
                }

            }



            if (billing) {
                obj.address.billing = {}
                // console.log(obj)
                if (address.billing.street) {
                    if (!isValid(address.billing.street)) {
                        return res.status(400).send({ status: false, msg: "billing street is not valid" })
                    }
                    obj.address.billing.street = address.billing.street
                    var billingStreet = address.billing.street
                }
                if (address.billing.city) {
                    if (!isValid(address.billing.city)) {
                        return res.status(400).send({ status: false, msg: "billing city is not valid" })
                    }
                    obj.address.billing.city = address.billing.city
                    var billingCity = address.billing.city
                }
                if (address.billing.pincode) {
                    if (!isValid(address.billing.pincode)) {
                        return res.status(400).send({ status: false, msg: "billing pincode is not valid" })
                    }
                    obj.address.billing.pincode = address.billing.pincode
                    var billingPincode = address.billing.pincode
                }

            }
        }

        if (files && files.length > 0) {

            let fileFormat = files[0].mimetype.split('/')

            if (fileFormat.indexOf('image') === -1) {
                return res.status(400).send({ status: false, msg: "you can only upload jpg/png/jpeg types of file" })
            }

            var uploadFileUrl = await uploadFile(files[0])
            let isimgeLinkUnique = await userModel.findOne({ profileImage: uploadFileUrl })
            if (isimgeLinkUnique) {
                return res.status(400).send({ status: false, msg: "image already in use" })
            }

            obj.profileImage = uploadFileUrl

        }




        console.log(obj)


        const updateData = await userModel.findOneAndUpdate(
            { _id: userId },
            { $set: { fname: fname, lname: lname, email: email, phone: phone, password: password, profileImage: uploadFileUrl, "address.shipping.city" : shippingCity, "address.shipping.street":shippingStreet,"address.shipping.pincode" :shippingpincode,"address.billing.city" : billingCity, "address.billing.street":billingStreet,"address.billing.pincode" : billingPincode } },
            // {$set : obj},
            { new: true }
        )
        return res.status(201).send({ status: false, msg: "User profile Updated", data: updateData })

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports.userProfile = userProfile
module.exports.userLogin = userLogin
module.exports.getUserData = getUserData
module.exports.updateUserProfile = updateUserProfile

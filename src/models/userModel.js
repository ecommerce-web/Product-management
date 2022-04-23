const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    lname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase:true,
        trim: true,
        validate: {
            validator: function (email) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
            }, message: 'Please fill a  valid email address', 
            isAsync: false

        }
    },

    profileImage: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (phone) {
                return /^[6-9]{1}[0-9]{9}$/.test(phone)
            }, message: "Please fill a valid phone number"
        }
    },

    password: {
        type: String,
        required: true,
      

    },
    address: {
        shipping: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            pincode: {
                type: Number, required: true, validate: {
                    validator: function (pincode) {
                        return /^[1-9][0-9]{5}$/.test(pincode)
                    }, message: "Please fill a valid pincode number"
                }
            }
        },

        billing: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            pincode: {
                type: Number, required: true,
                validate: {
                    validator: function (pincode) {
                        return /^[1-9][0-9]{5}$/.test(pincode)
                    }, message: "Please fill a valid pincode number"
                }
            }

        }
    },


}, {timestamps:true})


module.exports= mongoose.model('user', userSchema)
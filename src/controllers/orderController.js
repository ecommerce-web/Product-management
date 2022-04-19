const cartModel = require("../models/cartModel")
const mongoose = require("mongoose")

const productModel = require("../models/productModel")
const userModel = require("../models/userModel")
const orderModel = require("../models/orderModel")



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



const checkoutOrder = async function (req, res) {
    try {

        userId = req.params.userId
        data = req.body



        let totalQuantity = 0

        for (let i = 0; i < data.items.length; i++) {
            totalQuantity = totalQuantity + data.items[i].quantity

        }

        data.totalQuantity = totalQuantity
        const createOrder = await orderModel.create(data)

        return res.status(200).send({ status: true, msg: "Place your order", data: createOrder })
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}



const updateYourOrderStatus = async function (req, res) {
    try {

        userId = req.params.userId
        data = req.body

        if (Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "Nothing to update" })
        }

        if (!isValid(data.status)) {
            return res.status(400).send({ status: false, msg: "status value is not valid" })
        }

        let arr = ["completed", "canceled"]
        if (arr.indexOf(data.status.toLowerCase()) === -1) {

            return res.status(400).send({ status: false, msg: `status  will take only these 2 values ${arr}` })
        }

        const checkOrder = await orderModel.findOne({ userId })
        if (!checkOrder) {
            return res.status(400).send({ status: flse, msg: "no order exist for this user" })
        }

        if (checkOrder.cancellable === true) {
            if (data.status === "canceled") {
                const updateOrderDetails = await orderModel.findOneAndUpdate(
                    { userId },
                    { $set: { status: data.status.toLowerCase() } },
                    { new: true }
                )

                return res.status(200).send({ status: true, msg: "your order is canceled as per your request", data: updateOrderDetails })

            }
        } else {
            if (data.status.toLowerCase() === "canceled") {
                return res.status(400).send({ status: flse, msg: "this order is not cancellable as per our policy" })
            }

            if (data.status.toLowerCase() === "completed") {
                const updateOrderDetails = await orderModel.findOneAndUpdate(
                    { userId },
                    { $set: { status: data.status.toLowerCase() } },
                    { new: true }
                )

                return res.status(200).send({ status: true, msg: "your order is competed, Thanks for using our service", data: updateOrderDetails })
            }

        }
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports.checkoutOrder = checkoutOrder
module.exports.updateYourOrderStatus = updateYourOrderStatus
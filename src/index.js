const express  = require("express")
const route = require("./routes/route")

const bodyParser = require("body-parser")

const {default : mongoose} = require("mongoose")



const app = express()
const multer = require("multer")



app.use(bodyParser.json()) // to parse json data from request object

app.use(bodyParser.urlencoded({extended : true}))  
app.use(multer().any()) // to parse form data from request object

mongoose.connect("mongodb+srv://sp01041998:71HOQkRVAWXnVxw0@cluster0.deqvc.mongodb.net/group4DataBase?retryWrites=true&w=majority", {useNewUrlParser : true})
.then( () => console.log("mongodb is connected"))
.catch(err => console.log(err))  // here we are connectiong with our dataBase "mongoDb"


app.use('/', route) // here we want express to use userRoutes for all requests coming at "/" like /auth/login.

app.listen(process.env.PORT || 3000,  function() {
    console.log("Express app  is running on port " + (process.env.PORT || 3000))
})  // Server setup/port setup
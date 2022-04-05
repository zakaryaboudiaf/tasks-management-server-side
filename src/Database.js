const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

/*
===============================================================================================
    Connect DB function
===============================================================================================
*/

const connectDB = (uri) => {
    return mongoose.connect(uri)
}

/*
===============================================================================================
    Schemas Definition
===============================================================================================
*/

const userSchema = mongoose.Schema({
    name : {
        type : String,
        trim : true,
        required : [true , 'Please provide a name'],
        minLength : [3 , 'The name must be more then 3 caracters'],
        maxLength : [50 , 'The name must be less then 50 caracters']
    },
    lastName : {
        type : String,
        trim : true,
        maxLength : [50 , 'The last name must be less then 50 caracters']
    },
    email : {
        type : String,
        trim : true,
        unique : true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
          ],
        required : [true , 'Please provide an email'],
    },
    password : {
        type : String ,
        required : [true , 'please provide your password'],
        minLength : [6  , 'The password can not be more then 4 caracters'],
    }
})


const taskSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true , "The task name should be provided"],
        trim : true,
        maxlength : [ 50 , "The task name should be less than 50 charachters"],
        minlength : [ 4 , "The task name should be more than 4 charachters"]
    },

    status : {
        type : String,
        default : 'notstarted',
        enum : {
            values : ['notstarted' , 'started' , 'done'],
            message : '{VALUE} is not supported'
        }

    },
    createdBy : {
        type : mongoose.Types.ObjectId,
        ref : 'User',
        required : [true , 'Please provide user']
    }
},{ timestamps : true })

/*
===============================================================================================
    Pre Middlewares and methods
===============================================================================================
*/
userSchema.pre("save" , async function (next)  {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password , salt)
    next()
})

userSchema.methods.createJWT = function () {
    const token = jwt.sign({userId : this._id , name : this.name} , process.env.JWT_SECRET , { expiresIn : '1d'})
    return token
}

userSchema.methods.checkPassword = async function (password) {
    const match = await bcrypt.compare(password , this.password)
    return match
}


/*
===============================================================================================
    Models definition
===============================================================================================
*/

const User = mongoose.model('User' , userSchema)
const Task = mongoose.model('Task' , taskSchema)



module.exports = { connectDB , User , Task }
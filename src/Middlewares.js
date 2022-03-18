
const jwt = require('jsonwebtoken')
const { CustomError } = require('./Errors')


const notFoundMiddleware = (req , res , next) => {

    res.status(404).send("page not found")

}

const authenticationMiddleware = async (req , res , next) => {

    let token = req.headers.authentication
    if (!token || !token.startsWith('Bearer ')){
        return next( new CustomError('Invalid Token' , 401) )
    }
    token = req.headers.authentication.split(' ')[1]
    try{
        let user = await jwt.verify(token , process.env.JWT_SECRET)
        const { userId , name } = user
        req.user = {userId , name}
        next()
    }catch (error){

        next( new CustomError('Invalid Token',401) )
    }
    
}

const errorHandlerMiddleware = (err , req , res , next) => {
    
    if (err instanceof CustomError){
        
        return res.status(err.statusCode).json({ error : [err.message]})
    }

    if (err.name === "CastError"){

        res.status(400).json({ error : [err.message] })
    }

    if (err.name === "ValidationError") {

        const errArray = err.message.slice(23).split(',').map((item) => {
            return item.split(':')[1]
        })

        return res.status(400).json({ error : errArray })
    }

    if (err.name === "MongoServerError") {
      
        if (err.code === 11000){
            const  duplicateValue = err.message.split("\"")[1] 
            console.log(duplicateValue)
            return res.status(400).json({error : [`Duplicate value for: ${duplicateValue}`]})
        }

        return res.status(400).json({ error : [err.message]})
    }
    
    res.status(500).json({ error : ['Something went wrong. Please try later'] })
}


module.exports = { notFoundMiddleware , errorHandlerMiddleware , authenticationMiddleware}

const { User , Task } = require("./Database")
const { CustomError } = require('./Errors')

/*
===============================================================================================
    async Wrapper function for error handling
===============================================================================================
*/
const asyncWrapper = (fn) => {
    return async (req , res , next) =>{
        try{
            await fn(req , res , next)
        }catch (error){
            next(error)
        }
    }
}

/*
===============================================================================================
    Authentication Controllers (resister and login)
===============================================================================================
*/

const login = asyncWrapper( async (req , res , next) => {
    const {email , password} = req.body
    if (!password || !email){
        return(
            next( 
                new CustomError(email ? 'Please provide your password' : 'Please provide your email' , 400)
            )
        )
    }

    const user = await User.findOne({email})

    if(!user){
        return next( new CustomError('Invalid Email' , 401))
    }

    const passwordMatched = await user.checkPassword(password)
    
    if(!passwordMatched){
        return next( new CustomError('Wrong Password' , 401))
    }

    const token = user.createJWT()
    
    res.status(200).json({ user : {name : user.name} , token : token})
})

const register = asyncWrapper( async (req , res , next) => {

    const user = await User.create(req.body)
    const token = user.createJWT()
    res.status(201).json({ user : {name : user.name} , token : token})

})
/*
===============================================================================================
    Users Controllers 
===============================================================================================
*/
const getUser = asyncWrapper(async(req , res , next) => {
    const userId = req.user.userId
    const user = await User.findById({_id : userId})
    if(!user){
        return next( new CustomError('Invalid User' , 401))
    }
    const {_id , name , email} = user
    const lastName = user.lastName || ""
    res.status(200).json({_id , name , lastName , email})

})



const updateUser = asyncWrapper(async(req , res , next) => {

    const userId = req.user.userId
    const {name , email , lastName} = req.body
    if(!(name || email || lastName)){
        return next( new CustomError('At Least 1 of The user informations must be updated' , 401))
    }
    const updatedUserObj = {name : name , email : email , lastName : lastName}
    const user = await User.findOneAndUpdate({_id : userId} , updatedUserObj , { new : true , runValidators : true})
    if(!user){
        return next(new CustomError('Invalid User' , 401))
    }
    res.status(200).json(user)
})

const deleteUser = asyncWrapper(async(req , res , next) => {
    const userId = req.user.userId
    const {password} = req.body

    if(!password){
        return next(new CustomError('Please Confirm The Password' , 401))
    }

    const user = await User.findOne({_id : userId})

    if(!user){
        return next(new CustomError('Invalid User' , 401))
    }

    const passwordMatched = await user.checkPassword(password)

    if(!passwordMatched){
        return next(new CustomError('Wrong Password' , 401))
    }

    const userTasks = await Task.find({ createdBy : userId })

    userTasks.forEach(async(task) => {
        await Task.findByIdAndRemove({ _id : task._id , createdBy : userId})
    })

    const deletedUser = await User.deleteOne({_id : userId})

    res.status(200).json(user)
})

/*
===============================================================================================
    Tasks Controllers (Tasks CRUD Operations)
===============================================================================================
*/

const getAllJobs = asyncWrapper( async (req , res , next) => {

    const userId = req.user.userId
    let queryObject = { createdBy : userId }
    const { status , createdAt , updatedAt , sort } = req.query
    if(status){
        queryObject = {...queryObject , status : status}
    }
    if(createdAt){
        queryObject = {...queryObject , createdAt : {$lt : `${createdAt}T23:59:59.999Z`, $gt : `${createdAt}T00:00:00.000Z`}}
    }

    let query = Task.find(queryObject)

    if(sort){
        query = query.sort(sort)
    }
    
    const tasks = await query
    res.status(200).json(tasks)
    
})

const getSingleJob = asyncWrapper( async (req , res , next) => {

    const taskId = req.params.id
    const userId = req.user.userId
    const task = await Task.findOne({ _id : taskId , createdBy : userId })
    if (!task){
        return next( new CustomError(`There is no task with id: ${taskId}` , 404))
    }
    res.status(200).json(task)

})

const createJob = asyncWrapper( async (req , res , next) => {

    let taskObj = req.body
    taskObj.createdBy = req.user.userId
    const task = await Task.create(taskObj)
    res.status(201).json(task)

})

const updateJob = asyncWrapper( async (req , res , next) => {

    const taskId = req.params.id
    const userId = req.user.userId
    const task = await Task.findByIdAndUpdate({ _id : taskId , createdBy : userId} , req.body , { new : true , runValidators : true})
    if (!task){
        return next( new CustomError(`There is no task with id: ${taskId}` , 404))
    }
    res.status(200).json(task)

})

const deleteJob = asyncWrapper( async (req , res , next) => {

    const taskId = req.params.id
    const userId = req.user.userId
    const task = await Task.findByIdAndRemove({ _id : taskId , createdBy : userId})
    if (!task){
        return next( new CustomError(`There is no task with id: ${taskId}` , 404))
    }
    res.status(200).json(task)

})






module.exports = {
    login,
    register,
    getUser,
    updateUser,
    deleteUser,
    getAllJobs,
    getSingleJob,
    createJob,
    updateJob,
    deleteJob
}
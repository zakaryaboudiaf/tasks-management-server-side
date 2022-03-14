
const express = require("express")
const { authenticationMiddleware } = require("./Middlewares")
const { login , register , getAllJobs , getSingleJob , createJob , updateJob , deleteJob } = require("./Controllers")


const router = express.Router()

router.post('/auth/login' , login)
router.post('/auth/register' , register)

router.get('/tasks' , authenticationMiddleware , getAllJobs)
router.post('/tasks' , authenticationMiddleware , createJob)
router.get('/tasks/:id' , authenticationMiddleware , getSingleJob)
router.patch('/tasks/:id' , authenticationMiddleware , updateJob)
router.delete('/tasks/:id' , authenticationMiddleware , deleteJob)


module.exports = router
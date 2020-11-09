import { Router } from 'express'
import user from './user'
import project from './project'
import data from './data'
import mail from './mail'

const router = Router()

router.use('/user', user)
router.use('/project', project)
router.use('/data', data)
router.use('/mail', mail)

export default router

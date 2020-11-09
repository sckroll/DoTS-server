import { Router } from 'express'
import crypto from 'crypto'
import asyncHandler from 'express-async-handler'
import Project from '../models/projects'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let result = null
    if (req.query.id) {
      result = await Project.findOneById(req.query.id)
    } else {
      result = await Project.findByMember(req.query.email)
    }
    if (!result) {
      throw new Error('존재하지 않는 프로젝트입니다.')
    }
    res.send(result)
  }),
)

router.get(
  '/auth',
  asyncHandler(async (req, res) => {
    const projectId = req.query.project
    const memberEmail = req.query.member
    const token = req.query.token
    const userEmail = req.query.userEmail

    // 로그인 토큰 검사
    if (!userEmail) {
      throw new Error(
        '로그인이 필요합니다. 로그인 후에 다시 링크를 클릭해주세요.',
      )
    }
    // 프로젝트 팀원과 사용자 일치 여부 검사
    if (memberEmail !== userEmail) {
      throw new Error('올바른 초대 주소가 아닙니다.')
    }

    // 프로젝트 ID 검사
    const project = await Project.findOneById(projectId)

    // 프로젝트 팀원 검사
    const memberIndex = project.members.findIndex(
      member => member.email === memberEmail,
    )
    if (memberIndex === -1) {
      throw new Error('프로젝트에 초대받지 않은 회원입니다.')
    }

    // 인증 토큰 검사
    const verifiedMember = project.members[memberIndex]
    if (verifiedMember.verify_key !== token) {
      throw new Error('인증 토큰이 일치하지 않습니다.')
    }

    const updatedProject = project
    verifiedMember.verified = true

    // 기존 프로젝트 멤버 삭제 후 새 멤버 추가
    updatedProject.members.splice(memberIndex, 1)
    updatedProject.members.push(verifiedMember)

    const doc = await Project.findOneAndUpdate(
      { project_id: projectId },
      updatedProject,
      { new: true },
    )
    res.send(doc)
  }),
)

// 새로 생성한 프로젝트의 정보를 DB에 저장
router.post(
  '/',
  asyncHandler(async (req, res) => {
    // 프로젝트 ID 생성 후 중복 검사
    let projectId = null
    while (true) {
      projectId = Math.random().toString(36).substring(2, 12)
      const isCreated = await Project.findOneById(projectId)
      if (!isCreated) {
        break
      }
    }

    // 중복되는 프로젝트 이름이 존재하는지 검사
    const result = await Project.findOneByName(req.body.projectName)
    if (result) {
      throw new Error('이미 해당 프로젝트의 이름이 존재합니다.')
    }

    const firstKey = crypto.randomBytes(256).toString('base64').substr(100, 16)
    const secondKey = crypto.randomBytes(256).toString('hex').substr(200, 16)
    const verifyKey = firstKey + secondKey

    const newProject = new Project({
      // project_id: req.body.projectId,
      project_id: projectId,
      project_name: req.body.projectName,
      description: req.body.description,
      topic: req.body.topic,
      team_name: req.body.teamName,
      founder_email: req.body.user.email,
      members: [],
    })

    const newMember = {
      email: req.body.user.email,
      first_name: req.body.user.firstName,
      last_name: req.body.user.lastName,
      position: '팀장',
      color: req.body.user.color,
      verified: true,
      verify_key: verifyKey,
    }

    newProject.members.push(newMember)

    const createdProject = await Project.create(newProject)
    res.send(createdProject)

    // User.findOneByEmail(req.body.founderEmail)
    // 	.then(value => {
    // 		const newMember = {
    // 			user: value._id,
    // 			position: '팀장'
    // 		}

    // 		newProject.members.push(newMember)

    // 		Project.create(newProject)
    // 			.then(r => {
    // 				console.log('Successed: ' + req.body.projectName)
    // 				res.send(r)
    // 			})
    // 			.catch(e => {
    // 				console.log('Failed: ' + req.body.projectName)
    // 				res.send(e)
    // 			})
    // 	})
    // 	.catch(error => {
    // 		res.send(error)
    // 	})
  }),
)

// 프로젝트 삭제
router.delete(
  '/:name',
  asyncHandler(async (req, res) => {
    const result = await Project.deleteOne({ project_name: req.params.name })
    res.send(result)
  }),
)

export default router

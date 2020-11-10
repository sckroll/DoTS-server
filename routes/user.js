import { Router } from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import moment from 'moment'
import asyncHandler from 'express-async-handler'
import User from '../models/users'
// import jwtConfig from '../config/jwt'
// import jwtConfig from '../../configData/jwt'

const router = Router()
router.use(cors())

// 토큰 생성 함수
const signToken = pl => {
  return new Promise((resolve, reject) => {
    const payload = {
      //_id: pl._id,
      first_name: pl.first_name,
      last_name: pl.last_name,
      email: pl.email,
      color: pl.color,
    }

    const option = {
      // expiresIn: jwtConfig.expireTime,
      expiresIn: process.env.JWT_EXPIRE_TIME,
    }

    // jwt.sign(payload, jwtConfig.secret, option, (err, token) => {
    jwt.sign(payload, process.env.JWT_KEY, option, (err, token) => {
      if (err) reject(err)
      resolve(token)
    })
  })
}

// 토큰 검사 함수
const verifyToken = t => {
  return new Promise((resolve, reject) => {
    // jwt.verify(t, jwtConfig.secret, (err, v) => {
    jwt.verify(t, process.env.JWT_KEY, (err, v) => {
      if (err) reject(err)
      resolve(v)
    })
  })
}

// 토큰 재발급 함수
const getToken = async t => {
  let vt = await verifyToken(t)
  const diff = moment(vt.exp * 1000).diff(moment(), 'seconds')

  console.log(`토큰 만료까지 남은 시간 : ${diff}초 ( ${vt.exp - vt.iat} )`)
  if (diff > (vt.exp - vt.iat) / 3) {
    return { user: vt, refreshToken: null }
  }

  const nt = await signToken(vt)
  vt = await verifyToken(nt)
  return { user: vt, refreshToken: nt }
}

// DB에 등록된 사용자 목록을 조회
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let result = null
    if (req.query.email) {
      // 특정 사용자의 정보를 조회
      result = await User.findOneByEmail(req.query.email)
      if (!result) {
        throw new Error('일치하는 사용자가 없습니다.')
      }
    } else {
      result = await User.findAll()
    }
    res.send(result)
  }),
)

// 회원가입한 사용자 정보를 DB에 저장
router.post(
  '/',
  asyncHandler(async (req, res) => {
    let userData = req.body
    const result = await User.findOneByEmail(userData.email)
    if (!result) {
      // const hash = await bcrypt.hash(userData.password, jwtConfig.saltFactor)
      const hash = await bcrypt.hash(userData.password, 10)
      const newUser = {
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        password: hash,
        color: userData.color,
      }

      const createdUser = await User.create(newUser)
      res.send(createdUser)
    } else {
      throw new Error('이미 가입한 계정입니다.')
    }
  }),
)

// 로그인
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = await User.findOneByEmail(req.body.email)
    if (result) {
      const isValid = bcrypt.compareSync(req.body.password, result.password)
      if (isValid) {
        const signedToken = await signToken(result)
        res.send(signedToken)
      } else {
        throw new Error(
          '가입된 이메일이 존재하지 않거나 올바른 비밀번호가 아닙니다.',
        )
      }
    } else {
      throw new Error(
        '가입된 이메일이 존재하지 않거나 올바른 비밀번호가 아닙니다.',
      )
    }
  }),
)

// 토큰 유효성 검사
router.post(
  '/check',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization
    const result = await getToken(token)
    console.log(result)
    res.send(result)
  }),
)

export default router

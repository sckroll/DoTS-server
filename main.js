import express from 'express'
import path from 'path'
import createError from 'http-errors'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import cors from 'cors'
import mongoose from 'mongoose'
import history from 'connect-history-api-fallback'
// import { DefaultAzureCredential } from '@azure/identity'
// import { SecretClient } from '@azure/keyvault-secrets'
// import databaseConfig from './config/database'
import databaseConfig from '../configData/database'
import api from './routes'

const app = express()

// CORS 옵션
var corsOptions = {
  origin:
    app.get('env') === 'production'
      ? 'https://dots-app.azurewebsites.net'
      : 'http://localhost:8080',
}

// Azure 비밀키 설정
// const keyVaultName = 'dots-key-vault'
// const KVUri = `https://${keyVaultName}.vault.azure.net`
// const credential = new DefaultAzureCredential()
// const client = new SecretClient(KVUri, credential)

// 미들웨어 설정
app.use(logger('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors(corsOptions))

// 라우트 연결
app.use('/api', api)

// HTML5 pushState 기반 라우팅 미들웨어 설정
// (라우트 연결 이후에 설정해야 정상적으로 동작함)
app.use(history())

// 정적 라우터 미들웨어 설정
app.use(express.static(path.join(__dirname, 'public')))

// MongoDB 연결
mongoose.connect(databaseConfig.uri, databaseConfig.options)
// const connectDB = async () => {
//   const dbUri = await client.getSecret('dbUri')
//   const dbOptions = {
//     dbName: 'JMH',
//     useCreateIndex: true,
//     useNewUrlParser: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true,
//   }
//   await mongoose.connect(dbUri, dbOptions)
// }
// connectDB()

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connetion error'))
db.once('open', () => {
  console.log('Mongoose connected')
})

// 404 에러를 에러 핸들러로 포워딩
app.use((req, res, next) => {
  next(createError(404))
})

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500)
  if (err.name === 'NotFoundError') {
    res.json({ message: '일치하는 사용자가 없습니다.' })
  } else {
    res.json({ message: err.message })
  }
})

export default app

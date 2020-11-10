import { Router } from 'express'
import mongoose from 'mongoose'
import axios from 'axios'
import asyncHandler from 'express-async-handler'
import url from 'url'
import qs from 'querystring'
import schema from '../models/crawled-data'

const router = Router()
// const serverURL = 'https://dots-crawler.azurewebsites.net/'
const serverURL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://dots-crawler.azurewebsites.net'

let Data = null

// 사용할 검색 엔진
const SEARCH_ENG = 'google'

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const member = req.query.memberEmail
    Data = mongoose.model(
      'CrawledData',
      schema,
      `${req.query.name}_${member ? member : 'after_data'}`,
    )

    // Data.findAll()
    const result = await Data.find({}, '-screenshot')
    res.send(result)
  }),
)

// 크롤링 서버로 중단 신호를 보내고 통합 컬렉션으로부터 데이터 불러오기
router.get(
  '/stop',
  asyncHandler(async (req, res) => {
    await axios.get(serverURL + '/stop', {
      params: { project_name: req.query.name },
    })
    Data = mongoose.model('CrawledData', schema, `${req.query.name}_after_data`)
    const result = await Data.findAll()
    res.send(result)
  }),
)

router.get(
  '/origin',
  asyncHandler(async (req, res) => {
    Data = mongoose.model('CrawledData', schema, `${req.query.name}_after_data`)
    const result = await Data.findOne(
      { user_email: req.query.founder, curr_url: req.query.currURL },
      '-screenshot',
    )
    const nodeId = result._id.toString()
    const resultObj = await axios.get(serverURL + '/origin', {
      params: { project_name: req.query.name, node_id: nodeId },
    })

    // 2개의 오브젝트 ID를 받아 각각 노드를 검색 후 배열로 반환하는 방법
    const nodes = await Promise.all(
      resultObj.data.node_list.map(async id => {
        const node = await Data.findOne({ _id: id }, 'user_email curr_url')
        return {
          founder: node.user_email,
          currUrl: node.curr_url,
        }
      }),
    )
    res.send(nodes)
  }),
)

router.get(
  '/recommendation',
  asyncHandler(async (req, res) => {
    const resultObj = await axios.get(serverURL + '/recommendation', {
      params: { project_name: req.query.name },
    })
    // 여러 개의 오브젝트 ID를 받아 각각 노드를 검색 후 배열로 반환하는 방법
    const nodes = await Promise.all(
      resultObj.data.node_list.map(id => {
        return new Promise(response => {
          Data.findOne({ _id: id }, 'user_email curr_url')
            .then(node => {
              response({ founder: node.user_email, curr_url: node.curr_url })
            })
            .catch(err => {
              throw err
            })
        })
      }),
    )
    res.send(nodes)
  }),
)

router.post(
  '/tag-or-memo',
  asyncHandler(async (req, res) => {
    console.log(req.body)

    const result = await Data.findOne(
      { user_email: req.body.email, curr_url: req.body.currURL },
      '-screenshot',
    )
    if (!result) {
      throw new Error(
        '현재 페이지에 대해 크롤링을 수행한 기록이 없습니다. 먼저 DoTS 홈페이지에서 크롤링을 시작해주세요',
      )
    }

    console.log('tagged: ' + result.tagged)
    const modifiedObj = {
      project_name: req.body.projectName,
      user_email: req.body.email,
      node_id: result._id,
      modified_tag: result.tagged.indexOf('False') !== -1 ? 'True' : 'False',
      modified_memo: req.body.memo ? req.body.memo : result.memo,
    }
    console.log(modifiedObj)

    await axios.post(serverURL + '/tag-or-memo/user', modifiedObj)
    const resultData = axios.post(serverURL + '/tag-or-memo/all', modifiedObj)
    res.send(resultData.data)
  }),
)

// router.post(
//   '/tag',
//   asyncHandler(async (req, res) => {
//     console.log(req.body)

//     // Data.findOneByUrl(req.body.currURL)
//     Data.findOne(
//       { user_email: req.body.email, curr_url: req.body.currURL },
//       '-screenshot',
//     )
//       .then(result => {
//         if (result) {
//           // var newUserData = result
//           // var isTagged
//           // if (newUserData.tagged.indexOf(req.body.email) === -1) {
//           // 	isTagged = true
//           // 	newUserData.tagged.push(req.body.email)

//           // 	Data.findOneAndUpdate({ 'curr_url': req.body.currURL }, newUserData, { new: true }, (err, doc) => {
//           // 		if (err) {
//           // 			res.json({error: '태그 표시 중에 오류가 발생하였습니다.'})
//           // 		} else {
//           // 			res.send(doc)
//           // 		}
//           // 	})
//           // } else {
//           // 	isTagged = false
//           // 	res.json({error: '이미 현재 페이지에 대해 태그를 표시하셨습니다.'})
//           // }

//           // 도큐먼트 ID, 태그 여부 전달
//           axios
//             .put(serverURL + '/tag', {
//               project_name: req.body.projectName,
//               _id: result._id,
//               tagged: 'True',
//             })
//             .then(response => {
//               res.send(response)
//             })
//             .catch(err => {
//               res.json({ error: '태그 표시 중에 오류가 발생하였습니다.' })
//             })
//         } else {
//           res.json({
//             error:
//               '현재 페이지에 대해 크롤링을 수행한 기록이 없습니다. 먼저 DoTS 홈페이지에서 크롤링을 시작해주세요',
//           })
//         }
//       })
//       .catch(err => {
//         throw err
//       })
//   }),
// )

// router.post(
//   '/memo',
//   asyncHandler(async (req, res) => {
//     console.log(req.body)

//     // Data.findOneByUrl(req.body.currURL)
//     Data.findOne({ user_email: req.body.email, curr_url: req.body.currURL })
//       .then(result => {
//         if (result) {
//           // var newUserData = result
//           // newUserData.memo = req.body.memo

//           // Data.findOneAndUpdate({ 'curr_url': req.body.currURL }, newUserData, { new: true }, (err, doc) => {
//           // 	if (err) {
//           // 		res.json({error: '메모 저장에 오류가 발생하였습니다.'})
//           // 	} else {
//           // 		res.send(doc)
//           // 	}
//           // })

//           // 도큐먼트 ID, 메모 전달
//           axios
//             .put(serverURL + '/memo', {
//               project_name: req.body.projectName,
//               _id: result._id,
//               memo: req.body.memo,
//             })
//             .then(response => {
//               res.send(response)
//             })
//             .catch(err => {
//               res.json({ error: '메모 저장에 오류가 발생하였습니다.' })
//             })
//         } else {
//           res.json({
//             error:
//               '현재 페이지에 대해 크롤링을 수행한 기록이 없습니다. 먼저 DoTS 홈페이지에서 크롤링을 시작해주세요',
//           })
//         }
//       })
//       .catch(err => {
//         throw err
//       })
//   }),
// )

router.post(
  '/node',
  asyncHandler(async (req, res) => {
    const parsedUrl = url.parse(req.body.currURL)
    const hostname = parsedUrl.hostname
    let paths = [hostname]
    let level

    // 우선 호스트 주소가 타당한지 검사
    let isCrawlable = true
    let isMainPage = false
    if (hostname && parsedUrl.protocol) {
      if (hostname.indexOf('www.' + SEARCH_ENG) !== -1) {
        // 레벨 1일 경우
        level = 1

        const query = qs.parse(parsedUrl.query)
        if (query.q) {
          paths.push(query.q)
        } else {
          // URL에 google이 포함되어 있는 경우
          // Google 메인 홈페이지는 크롤링 대상이 아니므로 DB에 추가하지 않음
          isCrawlable = false
          isMainPage = true
        }
      } else {
        // 레벨 2 이상일 경우
        // 정규표현식을 사용하여 path를 구분
        var pathnames = parsedUrl.pathname.match(
          /\/([a-z0-9-~%@#_.!]{1,})/gi || [],
        )

        level = req.body.parentLevel + 1
        if (pathnames) {
          // level = req.body.parentLevel + 1
          paths = paths.concat(pathnames)
        } else {
          // level = 2
        }
      }
    } else {
      // URL 형태가 아닐 경우
      isCrawlable = false
    }

    if (isCrawlable) {
      // 이 부분에서 파이썬(Selenium) 연동

      // selenium 실행을 위해 JSON으로 묶어서 인수로 전달
      const newUserData = {
        project_name: req.body.projectName,
        user_email: req.body.userEmail,
        user_name: req.body.userName,
        // tagged: [],
        tagged: 'False',
        prev_url: req.body.prevURL,
        curr_url: req.body.currURL,
        level,
        paths,
        memo: '',
      }

      // // 사용자 DB에 저장하기 위해 Flask 서버로 전달
      // axios.post(serverURL + '/data', newUserData)
      // 	.then((result) => {
      // 		Data = mongoose.model('CrawledData', schema, `${req.body.projectName}_${req.body.userEmail}`)
      // 		// Data.findAll()
      // 		Data.find({}, '-screenshot')
      // 	}).then((result) => {
      // 		res.send(result)
      // 	}).catch((err) => {
      // 		res.send(err)
      // 	});

      Data = mongoose.model(
        'CrawledData',
        schema,
        `${req.body.projectName}_${req.body.userEmail}`,
      )
      let result = await Data.findOne(
        { user_email: req.body.userEmail, curr_url: req.body.currURL },
        '-screenshot',
      )
      if (!result) {
        await axios.post(serverURL + '/data', newUserData)
        result = await Data.findOne(
          {
            user_email: req.body.userEmail,
            curr_url: req.body.currURL,
          },
          '-screenshot',
        )
      }
      res.send(result)
    } else {
      res.send({ notUrl: true, isMainPage, level, paths })
    }
  }),
)

// 프로젝트 컬렉션 삭제
router.delete(
  '/:name',
  asyncHandler(async (req, res) => {
    const existed = await mongoose.connection.db
      .listCollections({
        name: req.params.name,
      })
      .toArray()
    if (existed.length > 0) {
      await mongoose.connection.dropCollection(`${req.params.name}`)
    }
    res.send()
  }),
)

// 프로젝트 내 크롤링 데이터 전부 삭제
router.delete(
  '/clear/:name',
  asyncHandler(async (req, res) => {
    Data = mongoose.model('CrawledData', schema, `${req.params.name}`)
    const result = await Data.deleteMany({})
    res.send(result)
  }),
)
export default router

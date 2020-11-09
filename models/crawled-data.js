import { Schema, model } from 'mongoose'

// 개인 크롤링 데이터 스키마 정의
const crawledDataSchema = new Schema(
  {
    user_email: { type: String, required: true, lowercase: true },
    user_name: { type: String },
    keyword: { type: String },
    sub_keyword: { type: [String] },
    tagged: { type: [String] },
    prev_url: { type: String },
    curr_url: { type: String, required: true },
    level: { type: Number },
    parent_id: { type: Number },
    paths: { type: [String] },
    memo: { type: String },
  },
  {
    timestamps: true,
  },
)

// Create new document
crawledDataSchema.statics.create = function (payload) {
  const todo = new this(payload)
  return todo.save()
}

// Find all
crawledDataSchema.statics.findAll = function () {
  return this.find({})
}

// Find one by url
crawledDataSchema.statics.findOneByUrl = function (curr_url) {
  return this.findOne({ curr_url })
}

// Find all by level
crawledDataSchema.statics.findAllByLevel = function (level) {
  return this.find({ level })
}

// Update by url
crawledDataSchema.statics.updateByUrl = function (curr_url, payload) {
  // { new: true }: return the modified document rather than the original. Defaults to false.
  return this.findOneAndUpdate({ curr_url }, payload, { new: true })
}

// Delete by url
crawledDataSchema.statics.deleteByUrl = function (curr_url) {
  return this.remove({ curr_url })
}

// module.exports = mongoose.model(
// 	'CrawledData',
// 	crawledDataSchema,
// 	'crawled_data'
// )

// 동적으로 모델을 생성하기 위해 모델 대신 스키마를 export함
export default crawledDataSchema

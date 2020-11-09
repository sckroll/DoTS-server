import { Schema, model } from 'mongoose'

// 사용자 정보 스키마 정의
const UsersSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    first_name: { type: String },
    last_name: { type: String },
    password: { type: String, required: true },
    color: { type: String, required: true, default: '#000000' },
  },
  {
    timestamps: true,
  },
)

// 새로운 사용자 생성
UsersSchema.statics.create = function (payload) {
  const todo = new this(payload)
  return todo.save()
}

// 모든 사용자 검색
UsersSchema.statics.findAll = function () {
  return this.find({})
}

// 이메일로 사용자 검색
UsersSchema.statics.findOneByEmail = function (email) {
  return this.findOne({ email })
}

// 이메일로 사용자 검색 후 업데이트
UsersSchema.statics.updateByEmail = function (email, payload) {
  // { new: true }: return the modified document rather than the original. Defaults to false.
  return this.findOneAndUpdate({ email }, payload, { new: true })
}

// 이메일로 사용자 검색 후 삭제
UsersSchema.statics.deleteByUrl = function (email) {
  return this.remove({ email })
}

export default model('Users', UsersSchema, 'users')

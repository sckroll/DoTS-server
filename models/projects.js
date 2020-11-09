import { Schema, model } from 'mongoose'

// // 프로젝트 팀원 정보 스키마 정의
// const MembersSchema = new mongoose.Schema({
// 	email: { type: String, required: true, unique: true, lowercase: true },
// 	position: { type: String },
// 	color: { type: String, required: true }
// })

// 프로젝트 정보 스키마 정의
const ProjectsSchema = new Schema(
  {
    project_id: { type: String, required: true, unique: true },
    project_name: { type: String, required: true },
    description: { type: String },
    topic: { type: String, required: true },
    team_name: { type: String, required: true },
    founder_email: { type: String, required: true, lowercase: true },
    // member: [MembersSchema]
    members: [
      {
        email: { type: String, required: true, lowercase: true },
        first_name: { type: String },
        last_name: { type: String },
        position: { type: String, required: true, default: '팀장' },
        color: { type: String, required: true, default: '#000000' },
        verified: { type: Boolean, required: true, default: false },
        verify_key: { type: String, required: true },
      },
      // {
      // 	user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
      // 	position: { type: String }
      // }
    ],
  },
  {
    timestamps: true,
  },
)

// Create new document
ProjectsSchema.statics.create = function (payload) {
  const todo = new this(payload)
  return todo.save()
}

// MembersSchema.statics.create = function(payload) {
// 	const todo = new this(payload)
// 	return todo.save()
// }

// Find all
ProjectsSchema.statics.findAll = function () {
  return this.find({})
}

// Find all by member email
ProjectsSchema.statics.findByMember = function (email) {
  return this.find({ 'members.email': email })
}

// Find one by project ID
ProjectsSchema.statics.findOneById = function (project_id) {
  return this.findOne({ project_id })
}

// Find one by project name
ProjectsSchema.statics.findOneByName = function (project_name) {
  return this.findOne({ project_name })
}

// Update by project ID
ProjectsSchema.statics.updateByProjectId = function (project_id, payload) {
  // { new: true }: return the modified document rather than the original. Defaults to false.
  return this.findOneAndUpdate({ project_id }, payload, { new: true })
}

// Delete by project ID
ProjectsSchema.statics.deleteByProjectId = function (project_id) {
  return this.remove({ project_id })
}

export default model('Projects', ProjectsSchema, 'projects')

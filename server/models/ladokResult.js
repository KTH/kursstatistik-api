'use strict'

/**
 * Sample API model. Can safely be removed.
 */

const mongoose = require('mongoose')

const schema = mongoose.Schema({
  _id: String,
  registedStudents: {
    type: String,
    default: '0'
  },
  result: {
    type: String,
    default: '0'
  }
})

const RoundStatistics = mongoose.model('RoundStatistics', schema)

module.exports = {
  RoundStatistics: RoundStatistics,
  schema: schema
}

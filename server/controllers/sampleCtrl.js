'use strict'

/**
 * Sample API controller. Can safely be removed.
 */
const log = require('kth-node-log')

// const ladokDB = require('../ladokDatabase')
// var bindings = require('bindings')('binding.node')
console.log('Loading ibmdb')

const ibmdb = require('ibm_db')

module.exports = {
  requestRoundStatisticsByLadokId: _requestRoundStatisticsByLadokId
}

async function _requestRoundStatisticsByLadokId (req, res, next) {
  var endDate = req.params.roundEndDate
  var ladokRoundIdList = req.body
  if (ladokRoundIdList.length === 0) {
    log.info('Empty ladokUID list in body')
    return res.status(204).json({ registeredStudents: '', examinationGrade: '' })
  }

  let formattedUID = ''
  let SQLFirstPartQuery = 'SELECT EXAMINATIONSDATUM_KURS, KURS_AVKLARAD_INOM_PERIOD, UTBILDNING_KOD FROM  UPPFOLJNING.IO_GENOMSTROMNING_KURS WHERE  OMREGISTRERAD_INOM_PERIOD=0  AND REGISTRERAD_INOM_PERIOD=1'
  log.info('Got endDate ' + endDate + ' and ladokUID: ' + ladokRoundIdList.toString())
  for (let index = 0; index < ladokRoundIdList.length; index++) {
    if (index === 0) {
      formattedUID += " AND ( UTBILDNINGSTILLFALLE_UID = X'" + ladokRoundIdList[index].split('-').join('') + "'"
    } else {
      formattedUID += " OR UTBILDNINGSTILLFALLE_UID = X'" + ladokRoundIdList[index].split('-').join('') + "'"
    }
  }
  SQLFirstPartQuery = SQLFirstPartQuery + formattedUID + ')'
  console.log(SQLFirstPartQuery, req.body)

  try {
    ibmdb.open(`DATABASE=${process.env.LADOK3_DATABASE};HOSTNAME=${process.env.STUNNEL_HOST};UID=${process.env.LADOK3_USERNAME};PWD=${process.env.LADOK3_PASSWORD};PORT=11000;PROTOCOL=TCPIP`, async function (err, conn) {
      if (err) {
        log.info('Error in connection to ladok uppföljningsdatabas' + err)
        res.status(400).json({ err })
      }

      await conn.query(SQLFirstPartQuery, function (err, data) {
        let responseObject = {
          registeredStudents: '',
          examinationGrade: ''
        }
        if (err) {
          console.log('err', err)
          return res.json({ err })
        } else {
          responseObject.registeredStudents = data.length
          var examinationInPeriod = 0
          // console.log('Reg sudents', data.length)
          for (let index = 0; index < data.length; index++) {
            if (data[index].KURS_AVKLARAD_INOM_PERIOD === 1 && data[index].EXAMINATIONSDATUM_KURS <= endDate) {
              examinationInPeriod++
              // console.log(data[index], examinationInPeriod)
            }
          }
        }
        log.info('examinationInPeriod:', examinationInPeriod)
        responseObject.examinationGrade = (examinationInPeriod / data.length) * 100
        conn.close(function () {
          log.info('Ladok connection closed')
        })
        log.info('Response from _requestRoundStatisticsByLadokId', responseObject)
        res.json({ responseObject })
      })
    })
  } catch (err) {
    log.error('Failed to _requestRoundStatisticsByLadokId, error:', { err })
    res.json({ err })
  }
}

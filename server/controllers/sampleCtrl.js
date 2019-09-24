'use strict'

/**
 * Sample API controller. Can safely be removed.
 */
const log = require('kth-node-log')

const ibmdb = require('ibm_db')

module.exports = {
  requestRoundStatisticsByLadokId: _requestRoundStatisticsByLadokId
}

async function _requestRoundStatisticsByLadokId (req, res, next) {
  var endDate = req.params.roundEndDate
  var ladokRoundIdList = req.body
  if (endDate.length === 0) {
    log.info('Empty roundEndDate: not OK')
    return res.status(406).json({ message: 'roundEndDate can not be empty' })
  }

  if (ladokRoundIdList.length === 0) {
    log.info('Empty ladokUID list in body is okay though ladokUID can be missuíng in kopps, returning empty response ')
    return res.status(204).json({ registeredStudents: -1, examinationGrade: -1 })
  }

  /* ---- Building SQL query ---- */
  const reRegistered = 0
  const registeredInPeriod = 1
  const periodInOrder = 1
  let formattedUID = ''

  let sqlFirstPartQuery = `
  SELECT DISTINCT STUDENT_UID, EXAMINATIONSDATUM_KURS, UTBILDNING_KOD
  FROM UPPFOLJNING.IO_GENOMSTROMNING_KURS
  WHERE OMREGISTRERAD_INOM_PERIOD = ${reRegistered}
    AND REGISTRERAD_INOM_PERIOD = ${registeredInPeriod}
    AND PERIOD_I_ORDNING = ${periodInOrder}
  `
  log.info('Got endDate ' + endDate + ' and ladokUID: ' + ladokRoundIdList.toString())

  for (let index = 0; index < ladokRoundIdList.length; index++) {
    if (index === 0) {
      formattedUID += " AND ( UTBILDNINGSTILLFALLE_UID = X'" + ladokRoundIdList[index].split('-').join('') + "'"
    } else {
      formattedUID += " OR UTBILDNINGSTILLFALLE_UID = X'" + ladokRoundIdList[index].split('-').join('') + "'"
    }
  }
  const SQLquery = sqlFirstPartQuery + formattedUID + ')'

  try {
    const connectionString = `DATABASE=${process.env.LADOK3_DATABASE};HOSTNAME=${process.env.STUNNEL_HOST};UID=${process.env.LADOK3_USERNAME};PWD=${process.env.LADOK3_PASSWORD};PORT=${process.env.STUNNEL_PORT};PROTOCOL=TCPIP`
    ibmdb.open(connectionString, async function (err, conn) {
      if (err) {
        log.info('Error in connection to ladok uppföljningsdatabas' + err)
        res.status(400).json({ err })
      }

      await conn.query(SQLquery, function (err, data) {
        if (err) {
          log.error('err', err)
          return res.json({ err })
        }
        log.info('Connected to Ladok uppföljningsdatabas')
        let responseObject = {
          registeredStudents: '',
          examinationGrade: ''
        }
        responseObject.registeredStudents = data.length
        var examinationInPeriod = 0

        for (let index = 0; index < data.length; index++) {
          if (data[index].EXAMINATIONSDATUM_KURS <= endDate) {
            examinationInPeriod++
          }
        }

        log.info('result for number of examination in period:', examinationInPeriod)
        responseObject.examinationGrade = (examinationInPeriod / data.length) * 100
        conn.close(function () {
          log.info('Ladok connection closed')
        })
        log.info('Sending response from _requestRoundStatisticsByLadokId', responseObject)
        res.json({ responseObject })
      })
    })
  } catch (err) {
    log.error('Failed to _requestRoundStatisticsByLadokId, error:', { err })
    res.json({ err })
  }
}

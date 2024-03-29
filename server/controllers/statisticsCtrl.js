'use strict'

const log = require('@kth/log')

// eslint-disable-next-line import/no-extraneous-dependencies
const ibmdb = require('ibm_db')

function connectionCloseCallback() {
  log.debug('Ladok connection closed')
}

function createQueryCallback(res, conn, endDate) {
  return function queryCallback(err, data) {
    if (err) {
      log.error('err', err)
      return res.json({ err })
    }
    log.debug('Connected to Ladok uppföljningsdatabas')
    const responseObject = {
      registeredStudents: '',
      examinationGrade: '',
    }

    responseObject.registeredStudents = data.length
    let examinationInPeriod = 0

    for (let index = 0; index < data.length; index++) {
      if (data[index].EXAMINATIONSDATUM_KURS <= endDate) {
        examinationInPeriod++
      }
    }

    log.debug('result for number of examination in period:', examinationInPeriod)
    responseObject.examinationGrade = (examinationInPeriod / data.length) * 100
    conn.close(connectionCloseCallback)
    log.debug('Sending response from _requestRoundStatisticsByLadokId', responseObject)
    return res.json({ responseObject })
  }
}

function createConnectionCallback(res, queryOptions, endDate) {
  return async function connectionCallback(err, conn) {
    if (err) {
      log.debug('Error in connection to ladok uppföljningsdatabas' + err)
      return res.status(400).json({ err })
    }

    await conn.query(queryOptions, createQueryCallback(res, conn, endDate))
    return null
  }
}

function createSQLParameterForLadokUID(ladokUID) {
  const joinedLadokUID = ladokUID.split('-').join('')

  const ladokUIDAsBuffer = Buffer.from(joinedLadokUID, 'hex')

  const ladokUIDAsUint8Array = new Uint8Array(
    ladokUIDAsBuffer.buffer,
    ladokUIDAsBuffer.byteOffset,
    ladokUIDAsBuffer.byteLength / Uint8Array.BYTES_PER_ELEMENT
  )

  const sqlParameter = { ParamType: 'INPUT', SQLType: 'BINARY', Data: ladokUIDAsUint8Array }

  return sqlParameter
}

function createWhereSQLAndMatchingParams(ladokUIDList) {
  const params = []
  const ladokUIDSQLParts = []

  for (let index = 0; index < ladokUIDList.length; index++) {
    ladokUIDSQLParts.push(`UTBILDNINGSTILLFALLE_UID = ?`)

    const parameter = createSQLParameterForLadokUID(ladokUIDList[index])

    params.push(parameter)
  }

  const whereLadokUIDSQLPart = `AND (${ladokUIDSQLParts.join(' OR ')})`
  return { sqlWhereLadokUIDPart: whereLadokUIDSQLPart, params }
}

function createQueryOptions(endDate, ladokUIDList) {
  const reRegistered = 0
  const registeredInPeriod = 1
  const periodInOrder = 1

  const sqlFirstPartQuery = `
  SELECT DISTINCT STUDENT_UID, EXAMINATIONSDATUM_KURS, UTBILDNING_KOD
  FROM UPPFOLJNING.IO_GENOMSTROMNING_KURS
  WHERE OMREGISTRERAD_INOM_PERIOD = ${reRegistered}
  AND REGISTRERAD_INOM_PERIOD = ${registeredInPeriod}
  AND PERIOD_I_ORDNING = ${periodInOrder}
  `

  log.debug('Got endDate ' + endDate + ' and ladokUID: ' + ladokUIDList.toString())

  const { sqlWhereLadokUIDPart, params } = createWhereSQLAndMatchingParams(ladokUIDList)

  const sql = sqlFirstPartQuery + sqlWhereLadokUIDPart

  const queryOptions = {
    sql,
    params,
  }

  return queryOptions
}

async function requestRoundStatisticsByLadokUID(req, res) {
  const endDate = req.params.roundEndDate
  const ladokUIDList = req.body

  if (endDate.length === 0) {
    log.debug('Empty roundEndDate: not OK')
    return res.status(406).json({ message: 'roundEndDate can not be empty' })
  }
  if (ladokUIDList.length === 0) {
    log.debug('Empty ladokUID list in body is okay though ladokUID can be missuíng in kopps, returning empty response ')
    return res.status(204).json({ registeredStudents: -1, examinationGrade: -1 })
  }

  const queryString = createQueryOptions(endDate, ladokUIDList)

  try {
    const connectionString = `DATABASE=${process.env.LADOK3_DATABASE};HOSTNAME=${process.env.STUNNEL_HOST};UID=${process.env.LADOK3_USERNAME};PWD=${process.env.LADOK3_PASSWORD};PORT=${process.env.STUNNEL_PORT};PROTOCOL=TCPIP`

    ibmdb.open(connectionString, createConnectionCallback(res, queryString, endDate))
    return null
  } catch (err) {
    log.error('Failed to _requestRoundStatisticsByLadokId, error:', { err })
    return res.json({ err })
  }
}

module.exports = {
  requestRoundStatisticsByLadokId: requestRoundStatisticsByLadokUID,
  createQueryOptions,
  createQueryCallback,
}

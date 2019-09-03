'use strict'

const config = require('./configuration').server
const log = require('kth-node-log')
const ibmdb = require('ibm_db')

const firstQ = "SELECT EXAMINATIONSDATUM_KURS, KURS_AVKLARAD_INOM_PERIOD, UTBILDNING_KOD FROM  UPPFOLJNING.IO_GENOMSTROMNING_KURS WHERE  OMREGISTRERAD_INOM_PERIOD=0  AND REGISTRERAD_INOM_PERIOD=1 AND UTBILDNINGSTILLFALLE_UID = X'c73257f973da11e8b4e0063f9afb40e3'  ORDER BY EXAMINATIONSDATUM_KURS"

async function _fetchRoundStatistics (roundIdList) {
  ibmdb.open(`DATABASE=${process.env.LADOK3_DATABASE};HOSTNAME=${process.env.STUNNEL_HOST};UID=${process.env.LADOK3_USERNAME};PWD=${process.env.LADOK3_PASSWORD};PORT=11000;PROTOCOL=TCPIP`, async function (err, conn) {
    if (err) {
      return ('Error in connection to ladok uppföljningsdatabas' + err)
    }

    await conn.query(firstQ, function (err, data) {
      if (err) {
        console.log('err', err)
      } else {
        console.log('Reg sudents', data.length)
        // for (let index = 0; index < data.length; index++) { console.log(data[index]) }
      }

      conn.close(function () {
        console.log('done')
      })
      return data
    })
  })
}

module.exports = {
  fetchRoundStatistics: _fetchRoundStatistics
}

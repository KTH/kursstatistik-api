jest.mock('kth-node-log', () => {
  return {
    init: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }
})

jest.mock('ibm_db', () => {
  return {
    open: (connectionString, connectionCallback) => {
      const conn = {
        query: (queryString, queryCallback) => {
          const data = [
            {
              STUDENT_UID: '1',
              EXAMINATIONSDATUM_KURS: '2019-12-31',
              UTBILDNING_KOD: '1',
            },
          ]
          queryCallback(null, data)
        },
        close: jest.fn(),
      }
      connectionCallback(null, conn)
    },
  }
})

function buildReq(overrides = {}) {
  const req = { headers: { accept: 'application/json' }, body: {}, params: {}, ...overrides }
  return req
}

function buildRes(overrides = {}) {
  const res = {
    json: jest
      .fn(() => {
        return res
      })
      .mockName('json'),
    status: jest.fn(() => res).mockName('status'),
    type: jest.fn(() => res).mockName('type'),
    send: jest.fn(() => res).mockName('send'),
    render: jest.fn(() => res).mockName('render'),
    ...overrides,
  }
  return res
}

describe('Test functions of statisticsCtrl.js', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('path requestRoundStatisticsByLadokId responds', async () => {
    const ladokRoundId = 'bf42101f-5a3f-40d6-b48f-c14a0b0b43f2'
    const ladokRoundIds = [ladokRoundId]
    const roundEndDate = '2019-12-31'

    const { requestRoundStatisticsByLadokId } = require('../../server/controllers/statisticsCtrl')
    const req = buildReq({ params: { roundEndDate }, body: ladokRoundIds })
    const res = buildRes()

    const response = await requestRoundStatisticsByLadokId(req, res)
    expect(res.json).toHaveBeenCalledTimes(1)
  })

  test('creates SQL query string with single round id', async () => {
    const ladokRoundId = 'bf42101f-5a3f-40d6-b48f-c14a0b0b43f2'
    const ladokRoundIds = [ladokRoundId]
    const roundEndDate = '2019-12-31'
    const expectedQueryString = `
    SELECT DISTINCT STUDENT_UID, EXAMINATIONSDATUM_KURS, UTBILDNING_KOD
    FROM UPPFOLJNING.IO_GENOMSTROMNING_KURS
    WHERE OMREGISTRERAD_INOM_PERIOD = 0
      AND REGISTRERAD_INOM_PERIOD = 1
      AND PERIOD_I_ORDNING = 1
     AND ( UTBILDNINGSTILLFALLE_UID = X'bf42101f5a3f40d6b48fc14a0b0b43f2')`

    const { createQueryString } = require('../../server/controllers/statisticsCtrl')
    const queryString = createQueryString(roundEndDate, ladokRoundIds)
    expect(queryString).toBe(expectedQueryString)
  })

  test('creates SQL query string with multiple round ids', async () => {
    const ladokRoundId_1 = 'bf42101f-5a3f-40d6-b48f-c14a0b0b43f2'
    const ladokRoundId_2 = '33559e6c-5625-4259-8b45-a985860e07b1'
    const ladokRoundIds = [ladokRoundId_1, ladokRoundId_2]
    const roundEndDate = '2019-12-31'
    const expectedQueryString = `
    SELECT DISTINCT STUDENT_UID, EXAMINATIONSDATUM_KURS, UTBILDNING_KOD
    FROM UPPFOLJNING.IO_GENOMSTROMNING_KURS
    WHERE OMREGISTRERAD_INOM_PERIOD = 0
      AND REGISTRERAD_INOM_PERIOD = 1
      AND PERIOD_I_ORDNING = 1
     AND ( UTBILDNINGSTILLFALLE_UID = X'bf42101f5a3f40d6b48fc14a0b0b43f2' OR UTBILDNINGSTILLFALLE_UID = X'33559e6c562542598b45a985860e07b1')`

    const { createQueryString } = require('../../server/controllers/statisticsCtrl')
    const queryString = createQueryString(roundEndDate, ladokRoundIds)
    expect(queryString).toBe(expectedQueryString)
  })

  test('calculates registered students and examination grade', async () => {
    const { createQueryCallback } = require('../../server/controllers/statisticsCtrl')
    let queryCallbackResponse = {}
    const expectedResponseObject = { registeredStudents: 2, examinationGrade: 50 }
    const res = buildRes({
      json: data => {
        queryCallbackResponse = data
      },
    })
    const conn = {
      close: () => {},
    }
    const roundEndDate = '2019-12-31'
    const ladokResponseData = [
      {
        STUDENT_UID: '1',
        EXAMINATIONSDATUM_KURS: '2019-12-31',
        UTBILDNING_KOD: '1',
      },
      {
        STUDENT_UID: '2',
        EXAMINATIONSDATUM_KURS: '2020-01-01',
        UTBILDNING_KOD: '1',
      },
    ]

    const queryCallback = createQueryCallback(res, conn, roundEndDate)
    const response = queryCallback(undefined, ladokResponseData)
    expect(queryCallbackResponse.responseObject).toEqual(expectedResponseObject)
  })
})

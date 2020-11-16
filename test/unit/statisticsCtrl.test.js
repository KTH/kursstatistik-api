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
  test('requestRoundStatisticsByLadokId', async done => {
    const ladokRoundId = 'bf42101f-5a3f-40d6-b48f-c14a0b0b43f2'
    const ladokRoundIds = [ladokRoundId]
    const roundEndDate = '2019-12-31'

    const { requestRoundStatisticsByLadokId } = require('../../server/controllers/statisticsCtrl')
    const req = buildReq({ params: { roundEndDate }, body: ladokRoundIds })
    const res = buildRes()

    const response = await requestRoundStatisticsByLadokId(req, res)
    expect(res.json).toHaveBeenCalledTimes(1)
    done()
  })
})

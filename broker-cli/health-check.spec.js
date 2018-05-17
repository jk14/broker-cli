const path = require('path')
const {
  chai,
  sinon,
  rewire
} = require('test/test-helper')

const { expect } = chai
const programPath = path.resolve('broker-cli', 'health-check')
const program = rewire(programPath)

describe('healthCheck', () => {
  let args
  let opts
  let logger
  let revert
  let infoSpy
  let errorSpy
  let healthCheckSpy
  let brokerStub
  let rpcAddress

  const healthCheck = program.__get__('healthCheck')

  beforeEach(() => {
    rpcAddress = undefined
    args = {}
    opts = { rpcAddress }
    infoSpy = sinon.spy()
    errorSpy = sinon.spy()
    healthCheckSpy = sinon.spy()

    brokerStub = sinon.stub()
    brokerStub.prototype.healthCheck = healthCheckSpy

    revert = program.__set__('BrokerDaemonClient', brokerStub)

    logger = {
      info: infoSpy,
      error: errorSpy
    }
  })

  afterEach(() => {
    revert()
  })

  it('makes a request to the broker', () => {
    healthCheck(args, opts, logger)
    expect(healthCheckSpy).to.have.been.called()
  })
})
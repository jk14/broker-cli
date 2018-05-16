const grpc = require('grpc')
const path = require('path')

const RelayerClient = require('./relayer')
const Orderbook = require('./orderbook')
const BrokerService = require('./broker-service')

const BROKER_PROTO_PATH = './broker-daemon/proto/broker.proto'

/**
 * Abstract class for a grpc server
 *
 * @author kinesis
 */
class GrpcServer {
  constructor (logger, store, eventHandler) {
    this.logger = logger
    this.store = store
    this.eventHandler = eventHandler

    this.protoPath = path.resolve(BROKER_PROTO_PATH)

    this.server = new grpc.Server()
    this.relayer = new RelayerClient()

    this.brokerService = new BrokerService(this.protoPath, this)

    this.server.addService(this.brokerService.definition, this.brokerService.implementation)

    this.orderbooks = {}
  }

  /**
   * Listens to the assigned markets
   *
   * @param {Array<String>} markets
   * @returns {Promise<void>} promise that resolves when markets are caught up to the remote
   */
  async initializeMarkets (markets) {
    return Promise.all(markets.map((marketName) => {
      return this.initializeMarket(marketName)
    }))
  }

  /**
   * Listens to the assigned market
   *
   * @param {String} marketName
   * @returns {Promise<void>} promise that resolves when market is caught up to the remote
   */
  async initializeMarket (marketName) {
    // TODO: warn or no-op on a repeat market name
    this.orderbooks[marketName] = new Orderbook(marketName, this.relayer, this.store.sublevel(marketName), this.logger)
    return this.orderbooks[marketName].initialize()
  }

  /**
   * Binds a given rpc address for our grpc server
   *
   * @param {String} host
   * @returns {void}
   */
  listen (host) {
    this.server.bind(host, grpc.ServerCredentials.createInsecure())
    this.server.start()
  }
}

module.exports = GrpcServer
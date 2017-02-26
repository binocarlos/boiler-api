"use strict";
const tools = require('../tools')

const serializeReq = (req) => {
  return {
    method: req.method,
    url: req.url,
    headers: req.headers
  }
}

const serializeRes = (res, responseTime) => {
  return {
    statusCode: res.statusCode,
    headers: res.headers,
    responseTime
  }
}

const Middleware = (opts) => {

  opts = opts || {}

  const logger = opts.logger
  if(!logger) throw new Error('logger required for logMiddleware')

  return (req, res, next) => {

    const useLevel = opts.level || 'info'
    const id = tools.ensureRequestTracerId(req)
    const reqJSON = serializeReq(req)

    function onResFinished (err) {
      this.removeListener('finish', onResFinished)
      this.removeListener('error', onResFinished)

      const responseTime = Date.now() - this.startTime
      const resJSON = serializeRes(res, responseTime)

      if (err) {
        logger.error('request', id, {
          error: err.toString(),
          stack: err.stack,
          req: reqJSON,
          res: resJSON
        })
        return
      }

      logger[useLevel]('request', id, {
        req: reqJSON,
        res: resJSON
      }, 'request completed')
    }

    function onReqAborted () {
      var res = this.res
      res.statusCode = 408
      onResFinished.call(res, new Error('Aborted'))
    }

    req.id = id
    res.startTime = Date.now()
    if (!req.res) { req.res = res }

    res.on('finish', onResFinished)
    res.on('error', onResFinished)
    req.on('aborted', onReqAborted)

    if (next) {
      next()
    }
  }
}

module.exports = Middleware
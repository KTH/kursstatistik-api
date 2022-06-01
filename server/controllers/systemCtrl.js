'use strict'

const packageFile = require('../../package.json')
const os = require('os')
const fs = require('fs')
const log = require('@kth/log')
const getPaths = require('kth-node-express-routing').getPaths
const version = require('../../config/version')
const config = require('../configuration').server
const monitorSystems = require('@kth/monitor')

const Promise = require('bluebird')
const registry = require('component-registry').globalRegistry
const { IHealthCheck } = require('kth-node-monitor').interfaces
const exec = require('child_process').exec

/**
 * GET /swagger.json
 * Swagger config
 */
function getSwagger(req, res) {
  res.json(require('../../swagger.json'))
}

/**
 * GET /swagger
 * Swagger
 */
function getSwaggerUI(req, res) {
  const pathToSwaggerUi = require('swagger-ui-dist').absolutePath()
  const swaggerUrl = configServer.proxyPrefixPath.uri + '/swagger.json'
  const petstoreUrl = 'https://petstore.swagger.io/v2/swagger.json'

  const swaggerInitializerContent = fs
    .readFileSync(`${pathToSwaggerUi}/swagger-initializer.js`)
    .toString()
    .replace(petstoreUrl, swaggerUrl)

  return res.type('text/javascript').send(swaggerInitializerContent)
}

/**
 * GET /_about
 * About page
 */
function getAbout(req, res) {
  const paths = getPaths()

  res.render('system/about', {
    layout: '', // must be empty by some reason
    appName: JSON.stringify(packageFile.name),
    appVersion: JSON.stringify(packageFile.version),
    appDescription: JSON.stringify(packageFile.description),
    config: JSON.stringify(configServer.templateConfig),
    version: JSON.stringify(version),
    gitBranch: JSON.stringify(version.gitBranch),
    gitCommit: JSON.stringify(version.gitCommit),
    jenkinsBuildDate: version.jenkinsBuild
      ? _simpleDate(new Date(parseInt(version.jenkinsBuild, 10) * 1000))
      : JSON.stringify(version.jenkinsBuildDate),
    dockerName: JSON.stringify(version.dockerName),
    dockerVersion: JSON.stringify(version.dockerVersion),
    monitorUri: paths.system.monitor.uri,
    robotsUri: paths.system.robots.uri,
    hostname: os.hostname(),
    started,
    env: process.env.NODE_ENV,
  })
}

/**
 * GET /_monitor
 * Monitor page
 */
function getMonitor(req, res) {
  const stunnelStatus = new Promise((resolve, reject) => {
    exec('ps aux | grep "[s]tunnel"', (error, stdout, stderr) => {
      let message = 'OK'
      let statusCode = 200
      if (stderr) {
        message = 'ERROR Stunnel status check failed'
        statusCode = 500
      } else if (error || !stdout) {
        message = 'ERROR Stunnel has stopped'
      }
      resolve({ statusCode, message })
    })
  })

  // If we need local system checks, such as memory or disk, we would add it here.
  // Make sure it returns a promise which resolves with an object containing:
  // {statusCode: ###, message: '...'}
  // The property statusCode should be standard HTTP status codes.
  const localSystems = stunnelStatus

  /* -- You will normally not change anything below this line -- */

  // Determine system health based on the results of the checks above. Expects
  // arrays of promises as input. This returns a promise
  const systemHealthUtil = registry.getUtility(IHealthCheck, 'kth-node-system-check')
  const systemStatus = systemHealthUtil.status(localSystems)

  systemStatus
    .then(status => {
      // Return the result either as JSON or text
      if (req.headers['accept'] === 'application/json') {
        let outp = systemHealthUtil.renderJSON(status)
        res.status(status.statusCode).json(outp)
      } else {
        let outp = systemHealthUtil.renderText(status)
        res.type('text').status(status.statusCode).send(outp)
      }
    })
    .catch(err => {
      res.type('text').status(500).send(err)
    })
}

/**
 * GET /robots.txt
 * Robots.txt page
 */
function getRobotsTxt(req, res) {
  res.type('text').render('system/robots')
}

/**
 * GET /_paths
 * Return all paths for the system
 */
function getPathsHandler(req, res) {
  res.json(getPaths())
}

function checkAPIKey(req, res) {
  res.end()
}

/**
 * System controller for functions such as about and monitor.
 * Avoid making changes here in sub-projects.
 */
module.exports = {
  monitor: getMonitor,
  about: getAbout,
  robotsTxt: getRobotsTxt,
  paths: getPathsHandler,
  checkAPIKey: checkAPIKey,
  swagger: getSwagger,
}

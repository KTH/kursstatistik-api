'use strict'

const os = require('os')
const fs = require('fs')
const { exec } = require('child_process')

const log = require('@kth/log')
const monitorSystems = require('@kth/monitor')
const { getPaths } = require('kth-node-express-routing')
const version = require('../../config/version')
const configServer = require('../configuration').server
const packageFile = require('../../package.json')

/**
 * * Adds a zero (0) to numbers less then ten (10)
 */
function zeroPad(value) {
  return value < 10 ? '0' + value : value
}

/**
 * Takes a Date object and returns a simple date string.
 */
function _simpleDate(date) {
  const year = date.getFullYear()
  const month = zeroPad(date.getMonth() + 1)
  const day = zeroPad(date.getDate())
  const hours = zeroPad(date.getHours())
  const minutes = zeroPad(date.getMinutes())
  const seconds = zeroPad(date.getSeconds())
  const hoursBeforeGMT = date.getTimezoneOffset() / -60
  const timezone = [' GMT', ' CET', ' CEST'][hoursBeforeGMT] || ''

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${timezone}`
}
const started = _simpleDate(new Date())

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
async function getMonitor(req, res) {
  const stunnelStatus = {
    message: '- stunnel status: OK',
    statusCode: 200,
  }

  exec('ps aux | grep "[s]tunnel"', { timeout: 1500 }, (error, stdout, stderr) => {
    if (stderr) {
      stunnelStatus.message = 'ERROR Stunnel status check failed'
      stunnelStatus.statusCode = 500
    } else if (error || !stdout) {
      stunnelStatus.message = 'ERROR Stunnel has stopped'
      stunnelStatus.statusCode = 500
    }
  })

  try {
    await monitorSystems(req, res, [
      {
        key: 'local',
        isResolved: true,
        message: '- local system checks: OK',
        statusCode: 200,
      },
      {
        key: 'stunnel',
        isResolved: stunnelStatus.statusCode === 200,
        required: true, // if required
        message: stunnelStatus.message,
        statusCode: stunnelStatus.statusCode,
      },
    ])
  } catch (error) {
    log.error('Monitor failed', error)
    res.status(500).end()
  }
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
  checkAPIKey,
  swagger: getSwagger,
  swaggerUI: getSwaggerUI,
}

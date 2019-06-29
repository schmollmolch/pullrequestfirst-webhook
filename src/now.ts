// see https://github.com/chadfawcett/probot-serverless-now

const { serverless } = require('@chadfawcett/probot-serverless-now')
const appFn = require('./')
module.exports = serverless(appFn)
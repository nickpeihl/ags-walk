#!/usr/bin/env node

var minimist = require('minimist')
var chalk = require('chalk')
var url = require('url')

var lib = require('./')

var USAGE = chalk`
  $ npx {bold ags-walk} {green.bold <server-url>} [options]

  Options:

  -h, --help       print usage
  -v, --version    print version
  -l, --limit      limit the maximum number of folders to index at the same time, default 5

  For example:
    $ npx {bold ags-walk} {green.bold http://sampleserver6.arcgisonline.com/arcgis/rest/services}
  
`

var NOSERVER = chalk`
  Please specify the base url of an ArcGIS Server Rest API:
    $ npx {bold ags-walk} {green.bold <server-url>} [options]

  For example:
    $ npx {bold ags-walk} {green.bold http://sampleserver6.arcgisonline.com/arcgis/rest/services}
  
  Run npx {bold ags-walk --help} to see all options.
`

var argv = minimist(process.argv.slice(2), {
  alias: {
    help: 'h',
    version: 'v',
    limit: 'l'
  },
  boolean: ['help', 'version']
})
;(function main (argv) {
  var server = argv._[0]
  var opts = {}
  if (argv.limit && Number.isInteger(argv.limit)) {
    opts = {
      limit: argv.limit
    }
  }

  if (argv.help) {
    console.log(USAGE)
  } else if (argv.version) {
    console.log(require('./package.json').version)
  } else if (!server) {
    console.error(NOSERVER)
    process.exit(1)
  } else {
    lib(server, opts, function (err, services) {
      if (err) {
        console.error(err)
        process.exit(1)
      } else {
        console.log(`Services available:`)
        services.forEach(function (service) {
          var uri = url.parse(server)
          uri.pathname = `${service.name}/${service.type}`
          console.log(
            chalk`
            Name: ${service.name}
            Type: ${service.type}
            URL: ${url.format(uri)}
          `
          )
        })
      }
    })
  }
})(argv)

var request = require('request')
var parallel = require('run-parallel-limit')
var flatten = require('flatten')

module.exports = agsWalk

/**
 * Walk the folders of an ArcGIS Server Rest API
 * and return all the services as an array
 * @name agsWalk
 * @param {string} url the base url of an ArcGIS Server Rest API
 * @param {Object} [opts] options for the module
 * @param {number} [opts.limit=5] the maximum number of folders to
 * index at the same time
 * @param {Function} cb the callback function to run after
 * results have been returned
 * @returns {Object[]}
 * @example
 * // returns [{ name: 'Elevation/earthquakedemoelevation, type: 'MapServer'}...]
 * agsWalk('http://sampleserver6.arcgisonline.com/arcgis/rest/services', function(err, services) {
 *  if (err) throw err
 *  return services
 * }
 */
function agsWalk (url, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  var limit = opts.limit || 5
  var services = (this.services = [])
  try {
    request.get(
      {
        url: url + '?f=json',
        json: true
      },
      function (err, res, data) {
        if (err) return cb(err)
        if (res.statusCode === 404) {
          return cb(res.statusMessage || 'Not Found')
        }
        if (!_isAgs(data)) {
          return cb('Is not a valid ArcGIS Server URL')
        }
        services.push(data.services)
        var harvester = _harvestFolders(url, data.folders)
        parallel(harvester, limit, function (err, res) {
          if (err) throw err
          services.push(
            res.map(function (folder) {
              return folder.services
            })
          )
          cb(null, flatten(services))
        })
      }
    )
  } catch (err) {
    return cb(err)
  }

  /**
   * checks to see if response contains currentVersion key
   * used by ArcGIS Server
   * @private
   * @returns {boolean}
   */
  function _isAgs (data) {
    return data['currentVersion'] !== undefined
  }

  /**
   * create array of request functions for each ArcGIS Server folder
   * @private
   * @param {string} baseUrl ArcGIS Server Rest API url
   * @param {string[]} folders an array of ArcGIS Server folders
   * @returns {Function[]}
   */
  function _harvestFolders (baseUrl, folders) {
    if (folders) {
      var tasks = folders.map(function (folder) {
        return function (cb) {
          var opts = {
            url: baseUrl + '/' + folder + '?f=json',
            json: true
          }
          request.get(opts, function (err, res, data) {
            if (err) return cb(err)
            cb(null, data)
          })
        }
      })
      return tasks
    } else {
      return []
    }
  }
}

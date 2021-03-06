const test = require('tape')
const agsWalk = require('./')
const http = require('http')

const rootNoServices = {
  'currentVersion': 10.22,
  'services': [
    'Thing1',
    'Thing2'
  ]
}

const root = {
  'currentVersion': 10.22,
  'folders': [
    'Basemaps'
  ],
  'services': [
    'Thing1',
    'Thing2'
    ]
}

const allServices = [
  'Thing1',
  'Thing2',
  'Thing3',
  'Thing4'
]

const basemaps = {
  'currentVersion': 10.22,
  'folders': [],
  'services': [
    'Thing3',
    'Thing4'
  ]
}

test('valid ags', function (t) {
  t.plan(2)
  const server = http.createServer(function (req, res) {
    if (req.url === '/arcgis/rest/services?f=json') {
      res.status = 200
      res.end(JSON.stringify(root))
    } else if (req.url === '/arcgis/rest/services/Basemaps?f=json') {
      res.statusCode = 200
      res.end(JSON.stringify(basemaps))
    } else {
      res.status = 404
    }

  })

  server.listen(0, function () {
    const port = server.address().port
    agsWalk('http://localhost:' + port + '/arcgis/rest/services', function (err, res) {
      t.error(err, 'should not error')
      t.deepEqual(res, allServices, 'should return array of services')
      server.close()
    })
  })
})

test('ags with no folders', function (t) {
  t.plan(3)
  const server = http.createServer(function (req, res) {
    t.equal(req.url, '/arcgis/rest/services?f=json', 'should return correct url')
    res.statusCode = 200
    res.end(JSON.stringify(rootNoServices))
  })
  server.listen(0, function () {
    const port = server.address().port
    agsWalk('http://localhost:' + port + '/arcgis/rest/services', function (err, res) {
      t.error(err)
      t.equal(res.length, 2)
      server.close()
    })
  })
})

test('invalid ags', function (t) {
  t.plan(3)
  const server = http.createServer(function(req, res) {
    t.equal(req.url, '/arcgis/bad/services?f=json', 'should return url with query string')
    res.statusCode = 200
    res.end(JSON.stringify({
      'pretty': 'bad'
    }))
  })
  server.listen(0, function () {
    const port = server.address().port
    agsWalk('http://localhost:' + port + '/arcgis/bad/services', function (err, res) {
      t.ok(err, 'should return error')
      t.equal(err, 'Is not a valid ArcGIS Server URL', 'correct error message')
      server.close()
    })
  })
})

test('404 with status message', function (t) {
  t.plan(3)
  const server = http.createServer(function (req, res) {
    t.equal(req.url, '/arcgis/404/services?f=json')
    res.statusCode = 404
    res.statusMessage = 'No comprende'
    res.end('<body><h1>404</h1</body>')
  })
  server.listen(0, function () {
    const port = server.address().port
    agsWalk('http://localhost:' + port + '/arcgis/404/services', function (err, res) {
      t.ok(err)
      t.equal(err, 'No comprende')
      server.close()
    })
  })
})

test('404 default status message', function (t) {
  t.plan(3)
  const server = http.createServer(function (req, res) {
    t.equal(req.url, '/arcgis/404/services?f=json')
    res.statusCode = 404
    res.end('<body><h1>404</h1</body>')
  })
  server.listen(0, function () {
    const port = server.address().port
    agsWalk('http://localhost:' + port + '/arcgis/404/services', function (err, res) {
      t.ok(err)
      t.equal(err, 'Not Found')
      server.close()
    })
  })
})

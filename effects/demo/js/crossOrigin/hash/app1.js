const http = require('http')
const fs = require('fs')

const server = http.createServer()

server.on('request', (req, res) => {
  if (req.url === '/a.html') {
  const data = fs.readFileSync('./a.html')
  res.end(data)
}
})

server.listen(3001, 'localhost')
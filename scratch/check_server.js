const http = require('http');

http.get('http://localhost:4000/topics', (res) => {
  console.log('Server is UP! Status Code:', res.statusCode);
  res.on('data', (chunk) => {
    // consume response
  });
}).on('error', (err) => {
  console.error('Server is DOWN! Error:', err.message);
});

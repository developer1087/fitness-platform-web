const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrfitnessplatformus175 = onRequest({}, (req, res) => server.then(it => it.handle(req, res)));
  
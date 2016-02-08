'use strict';

var exec = require('child_process').exec;
var assert = require('assert');
var crypto = require('crypto');

var ref = require('ref');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'), { multiArgs: true });

function derToPem (der) {
  var pmd = '-----BEGIN CERTIFICATE-----';

  var base64 = der.toString('base64');
  var size = base64.length;

  for (var i = 0; i < size; i = i + 64) {
    var end = i + 64 < size ? i + 64 : size;
    pmd = pmd + '\n' + base64.substring(i, end);
  }

  pmd = pmd + '\n-----END CERTIFICATE-----';

  return pmd;
}

var verisignRootCAPath = __dirname + '/ca/verisign-class-3-public-primary-certification-authority-g5.pem';
var symantecRootCAPath = __dirname + '/ca/symantec-class-3-SHA256-code-signing-ca.pem';

var command = [
  'openssl', 'verify',
  '-CAfile', verisignRootCAPath,
  '-untrusted', symantecRootCAPath
].join(' ');

function validateCaChain (pem) {
  return new Promise(function (resolve) {
    var openssl = exec(command, function (err, stdout, stderr) {
      assert(!stderr);
      var validationResult = stdout.toString().trim();
      assert(validationResult.lastIndexOf('OK') === validationResult.length - 2);
      assert(validationResult.indexOf('certificate has expired') === -1);

      return resolve();
    });
    openssl.stdin.write(pem);

    return openssl.stdin.end();
  });
}

/**
 * @param options
 * @param {String} options.playerId
 * @param {String} options.publicKeyURL
 * @param {String} options.signature
 * @param {String} options.salt
 * @param {String} options.timestamp
 * @param {String} options.bundleIdentifier
 */
module.exports = function gameKitAuth (options) {
  return Promise.try(function () {
    assert(typeof options.playerId === 'string');
    assert(typeof options.publicKeyURL === 'string');
    assert(typeof options.signature === 'string');
    assert(typeof options.salt === 'string');
    assert(typeof options.timestamp === 'string');
    assert(typeof options.bundleIdentifier === 'string');

    return request({url: options.publicKeyURL, encoding: null});
  })
    .spread(function (response, body) {
      assert(response.statusCode === 200);
      return derToPem(body);
    })
    .tap(validateCaChain)
    .then(function (pem) {
      var verifier = crypto.createVerify('sha256');
      var buf = ref.alloc('uint64');

      // Why Apple ? Why ?
      ref.writeUInt64BE(buf, 0, options.timestamp);

      // Fill the buffer
      verifier.update(options.playerId, 'utf8');
      verifier.update(options.bundleIdentifier, 'utf8');
      verifier.update(buf);
      verifier.update(options.salt, 'base64');

      assert(verifier.verify(pem, options.signature, 'base64'), 'Unable to verify the provided signature');

      return options.playerId;
    });
};

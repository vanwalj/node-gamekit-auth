'use strict';

var gameKitAuth = require('../index');

describe('gameKitAuth test suite', function () {
  it('should work !', function () {
    return gameKitAuth({
      bundleIdentifier: process.env.BUNDLE_IDENTIFIER,
      playerId: process.env.PLAYER_ID,
      publicKeyURL: process.env.PUBLIC_KEY_URL,
      salt: process.env.SALT,
      signature: process.env.SIGNATURE,
      timestamp: process.env.TIMESTAMP
    });
  });
});
# node-gamekit-auth
A simple node.js helper to auth an user using Apple GameKit

## Why ?
You now why, like me, you probably lost 2 hours, looking for a simple solution to auth a user to your node.js app using GameKit

## Todo
Currently there is no caching, this would probably be something nice to do
Also more descriptive error would be cool

## Usage

### Install
```
npm install --save gamekit-auth
```

### Simple stupid iOS side example usign Alamofire
``` swift
import Alamofire
import GameKit

class myCoolVc {
    func initGK() {
        let localPlayer = GKLocalPlayer.localPlayer()
        localPlayer.authenticateHandler = { vc, err in
            if let vc = vc {
                self.showViewController(vc, sender: self)
            } else if localPlayer.authenticated {
                login(localPlayer) { err in
                    debugPrint(err)
                    // READY TO GO
                }
            } else {
                debugPrint("Noeeeees")
            }
        }
    }

    func login(localPlayer: GKLocalPlayer, completionHandler: (NSError?) -> Void) {
        localPlayer.generateIdentityVerificationSignatureWithCompletionHandler { publicKeyUrl, signature, salt, timestamp, err in
            guard err == nil else { return completionHandler(err) }

            let parameters = [
                "playerId": localPlayer.playerId!,
                "publicKeyURL": publicKeyUrl!.absoluteString,
                "signature": signature!.base64EncodedStringWithOptions([]),
                "salt": salt!.base64EncodedStringWithOptions([]),
                "timestamp": String(timestamp)
            ]

            Alamofire.request(.POST, YOUR_API_URL, parameters: parameters, encoding: .JSON)
                .validate()
                .responseJSON { response in
                    switch response.result {
                    case .Success:
                        return completionHandler(nil)
                    case .Failure(let err):
                        return completionHandler(err)
                    }
            }
        }
    }

}

```

### Node.js side
``` js

var gameKitAuth = require('gamekit-auth');

var bundleIdentifier = 'com.cool-company.cool-app';

function myCoolExressController(req, res, next) {
    gameKitAuth({
        playerId: req.body.playerId,
        publicKeyURL: req.body.publicKeyURL,
        signature: req.body.signature,
        salt: req.body.salt,
        timestamp: req.body.timestamp,
        bundleIdentifier: bundleIdentifier
    }).then(function () {
        // Success !
        res.status(200).end();
    }).catch(function (err) {
        console.error(err);
        res.status(400).end();
    });
}

```

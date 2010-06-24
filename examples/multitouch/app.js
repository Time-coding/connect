// NOTE:
// When testing this demo you need to ensure that the domain you're hosting
// it on is in the network section of the cache manifest (second argument)
// or the long-poll may not work.

require.paths.unshift("../../lib");
var Connect = require('connect');
var root = __dirname + "/public";

var subscribers = [];

var Backend = {
    subscribe: function (subscriber) {
        if (subscribers.indexOf(subscriber) < 0) {
            subscribers.push(subscriber);
            if (subscriber.timer) {
                clearTimeout(subscriber.timer);
            }
            subscriber.timer = setTimeout(function () {
                subscriber.flush();
            }, 1000);

        }
    },
    unsubscribe: function (subscriber) {
        var pos = subscribers.indexOf(subscriber);
        if (pos >= 0) {
            subscribers.slice(pos);
        }
    },
    publish: function (message, callback) {
        subscribers.forEach(function (subscriber) {
            subscriber.send(message);
        });
        callback();
    }
};


var Server = module.exports = Connect.createServer();

// Add global filters
Server.use("/",
    Connect.responseTime(),
    Connect.logger()
);

// Serve dynamic responses
Server.use("/stream",
    Connect.bodyDecoder(),
    Connect.pubsub(Backend)
);

// Serve static resources
Server.use("/",
    Connect.cacheManifest(root, ["http://localhost:3000/"]),
    Connect.conditionalGet(),
    Connect.cache(),
    Connect.gzip(),
    Connect.staticProvider(root)
);

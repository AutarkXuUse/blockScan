'use strict'
let serverName = 'blockScan'
process.title = serverName;

const Config = require('./config/config');
const Async = require('async');
const Sync = require('./services/sync');
const Shedule = require('./services/shedule');
const Logger = require('./utils/logger');
const ormInit = require('./db/init');

Config.supportAssets.forEach((value) => {
    global[value] = {height: 0, stop: false};
})

function initServer(areturn) {
    Async.series([
        function (done) {
            ormInit.initOrm((err) => {
                if (err) {
                    Logger.error('Init orm failed:' + err.message);
                    return done(err);
                }
                return done();
            })
        },
        function (done) {
            Async.eachSeries(Config.supportAssets, function (node, cb) {
                Sync.getLastHeightInDB(node, (err, result) => {
                    if (err) {
                        Logger.error('Query block height from db failed:' + err.message);
                        return cb(err);
                    }
                    global[node]['height'] = result;
                    return cb();
                })
            }, (err) => {
                if (err) {
                    return done(err);
                }
                return done()
            })
        },
        function (done) {
            Config.supportAssets.forEach((value) => {
                Shedule.startScan(value, global[value]['height']);
            })
            return done()
        }
    ], function (err) {
        if (err) {
            return areturn(err);
        }
        return areturn();
    })

}

//退出前处理;
function handleBeforeExit(err, value) {
    Logger.info("退出前处理", err, value);
    return true;
}

//退出处理;
function handleExit(err, value) {
    console.log("退出处理", err, value);
    safeExit();
    return true;
}

//SIGINT处理(Ctrl+C)
function handleSigInt(err, value) {
    Logger.warn("SIGINT处理，准备退出", err, value);
    safeExit();
}

function handleUncaughtException(err) {
    Logger.error("uncaught exception:", err.stack);
}

function safeExit() {
    Config.supportAssets.forEach((value) => {
        global[value]['stop'] = true;
    });
    process.exit();
}

initServer((err) => {
    if (err) {
        process.exit();
    }
    Logger.info('Server init success.Start running ...');
    process.on("beforeExit", handleBeforeExit);
    process.on("exit", handleExit);
    process.on("SIGINT", handleSigInt);
    process.on("uncaughtException", handleUncaughtException);
});
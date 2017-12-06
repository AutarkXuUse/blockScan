'use strict'

const Sync = require('./sync');
const Async = require('async');
const Logger = require('../utils/logger');

let startScan = function (asset) {
    global[asset]['height']++
    Async.waterfall([
            function (done) {
                Sync.getOneBlock4DB(asset, global[asset]['height'], (err, res) => {
                    if (err) {
                        return done(err)
                    }
                    return done(null, res);
                })
            },
            function (arg1, done) {
                Sync.persistOneBlock(asset, arg1, (err, res) => {
                    if (err) {
                        return done(err)
                    }
                    return done(null, res);
                })
            }
        ],
        function (err, result) {
            if (err) {
                Logger.error('Sync failed at ' + global[asset]['height']);
                Logger.warn('retry after 1 seconds');
                global[asset]['height']--;
            }else{
                Logger.info('Sync success at ' + global[asset]['height']);
            }
            startScan(asset)
        })
}

exports={
    startScan:startScan
}

Object.assign(module.exports,exports);

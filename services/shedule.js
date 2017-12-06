'use strict'

const Sync = require('./sync');
const Async = require('async');
const Logger = require('../utils/logger');

let startScan = function (asset) {
    if(global[asset]['stop']){
        Logger.warn('%s block scan stopped',asset);
        return;
    }
    global[asset]['height']++;
    Logger.info('Sync block :' +global[asset]['height']);
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
                setTimeout(()=>{startScan(asset)},1000)
            }else{
                Logger.info('Sync success at ' + global[asset]['height']);
                startScan(asset)
            }
        })
}

exports={
    startScan:startScan
}

Object.assign(module.exports,exports);

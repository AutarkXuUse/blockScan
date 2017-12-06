'use strict'
let serverName = 'blockScan'
process.title = serverName;

const Config = require('./config');
const Async=require('async');
const Sync=require('./services/sync');
const Shedule=require('./services/shedule');
const Logger = require('./utils/logger');
const ormInit=require('./db/init');

Config.supportAssets.forEach((value)=>{
    global[value]={height:0};
})

function initServer() {
    Async.series([
        function (done) {
            ormInit.initOrm((err)=>{
                if(err){
                    Logger.error('Init orm failed:'+err.message);
                    return done(err);
                }
                return done();
            })
        },
        function (done) {
            Sync.getLastHeightInDB('BTC',(err,result)=>{
                if(err){
                    Logger.error('Query block height from db failed:'+err.message);
                    return done(err);
                }
                global['BTC']['height']=result;
                return done();
            })

        },
        function (done) {
            Shedule.startScan('BTC',BTC['height'])
            return done()
        }
    ],function (err) {
        if(err){
            process.exit();
        }
        Logger.info('start success');
    })

}

initServer();
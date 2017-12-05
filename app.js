'use strict'
let serverName = 'blockScan'
process.title = serverName;

const Config = require('./config');
const Rawtx = require('./db/models/rawtx');
const Async=require('async');
global.rawtx_id = {};

function initGlobal() {
    Async.mapSeries(Config.supportAssets,function (node,done) {
        Rawtx[node].findAll(
            {
                where: {
                    asset: node,
                },
                order: [['id','DESC']],
                limit: 1
            }
        ).then(record => {
            if (record.length === 0) {
                rawtx_id[node]=0;
            } else {
                rawtx_id[node] = record[0].id;
            }
            return done();
        }).catch(err => {
            return done(err);
        });
    },(err,result)=>{
        if(err){
            console.log(err);
        }
        console.log(global.rawtx_id)
    })

}


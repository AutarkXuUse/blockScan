'use strict'
const ERR_SERVICE_CODE = require('../msgdefine/msgtype').ERR_SERVICE_CODE;
const Rpc = require('../rpcs/BTC');
const Async = require('async');

function getOneBlock4DB(height, areturn) {
    if (!height) {
        return areturn(new MyError(ERR_SERVICE_CODE.ERR_HEIGHT_NULL, '!height'));
    }

    Async.waterfall([
            function (done) {
                Rpc.getBlockHashByheight(height, (err, result) => {
                    if (err) {
                        return done(err);
                    }
                    return done(null, result);
                })
            },
            function (arg1, done) {
                Rpc.getBlockInfo(arg1, (err, result) => {
                    if (err) {
                        return done(err);
                    }
                    let rawtxs=[];
                    result['tx'].forEach(function (value,index,arr) {
                        rawtxs.push({
                            asset:'BTC',
                            height:height,
                            txid:value
                        });
                    })
                    return done(null, rawtxs);
                })
            },
            function (arg1, done) {
                Async.mapLimit(arg1['txid'],10,
                    function (node, cb) {
                        Rpc.getrawtransaction(node, (err, result) => {
                            if (err) {
                                return cb(err);
                            }
                            if(node!==result['hash']){
                                return done(ERR_SERVICE_CODE.ERR_HASH_NOT_EQUAL)
                            }
                            let rawtx_inputs=[];
                            result['vin'].forEach((value,index,arr)=>{
                                rawtx_inputs.push({
                                    asset:'BTC',
                                    tx_id:value['txid'],
                                    previous_output_id:value['vout'],
                                });
                            })

                        })
                    },
                    function (err, results) {

                    })
            }
        ],
        function () {

        })

}
'use strict'
const ERR_SERVICE_CODE = require('../msgdefine/msgtype').ERR_SERVICE_CODE;
const rpc = require('../rpcs/BTC');
const Async = require('async');
const Logger=require('../utils/logger')

function getOneBlock4DB(asset, height, areturn) {
    if (!height) {
        return areturn(new MyError(ERR_SERVICE_CODE.ERR_HEIGHT_NULL, '!height'));
    }

    let Rpc=new rpc();

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
                    let rawtxs = [];
                    result['tx'].forEach(function (value) {
                        rawtxs.push({
                            asset: asset,
                            height: height,
                            txid: value,
                        });
                    })
                    return done(null, rawtxs);
                })
            },
            function (arg1, done) {
                let rawtx_inputs = [];
                let rawtx_outputs = [];
                Async.eachSeries(arg1,
                    function (node, cb) {
                        Rpc.getrawtransaction(node['txid'], (err, result) => {
                            if (err) {
                                return cb(err);
                            }

                            if (node['txid'] !== result['hash']) {
                                return done(ERR_SERVICE_CODE.ERR_HASH_NOT_EQUAL)
                            }

                            result['vin'].forEach((value) => {
                                if(!value['coinbase']){
                                    rawtx_inputs.push({
                                        asset: asset,
                                        tx_id: value['txid'],
                                        previous_output_id: value['vout'],
                                    });
                                }
                            });

                            result['vout'].forEach((value) => {
                                rawtx_outputs.push({
                                    asset: asset,
                                    tx_id: node['txid'],
                                    output_index: value['n'],
                                    value: value['value'],
                                    address: value['scriptPubKey']['addresses'][0]
                                })
                            });
                            return cb()
                        })
                    },
                    function (err, results) {
                        if (err) {
                            return done(err);
                        }
                        return done(null, {rawtxs: arg1, rawtx_input: rawtx_inputs, rawtx_output: rawtx_outputs})
                    })
            }
        ],
        function (err, result) {
            if (err) {
                Logger.error(err);
                return areturn();
            }
            return areturn(null, result);
        })
}

getOneBlock4DB('BTC',170001,(err,res)=>{
    console.log(err);
    console.log(res);
})
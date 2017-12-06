'use strict'
const ERR_SERVICE_CODE = require('../msgdefine/msgtype').ERR_SERVICE_CODE;
const rpc = require('../rpcs/BTC');
const Async = require('async');
const Logger = require('../utils/logger');
const Rawtx = require('../db/models/rawtx');
const Rawtx_output = require('../db/models/rawtx_output');
const Rawtx_input = require('../db/models/rawtx_input');
let DBWallet = require('../db/connect').DBWallet;
let sequelize = require('sequelize');
const ErrorCode = require('../msgdefine/msgtype');

exports.getOneBlock4DB = function (asset, height, areturn) {
    if (!height) {
        return areturn(new MyError(ERR_SERVICE_CODE.ERR_HEIGHT_NULL, '!height'));
    }

    let Rpc = new rpc();

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
                                if (!value['coinbase']) {
                                    rawtx_inputs.push({
                                        asset: asset,
                                        tx_id: value['txid'],
                                        output_index: value['vout'],
                                        used_txid: node['txid'],
                                    });
                                }
                            });

                            result['vout'].forEach((value) => {
                                if (value['scriptPubKey']['type'] === 'nonstandard') {
                                    rawtx_outputs.push({
                                        asset: asset,
                                        tx_id: node['txid'],
                                        output_index: value['n'],
                                        value: value['value'],
                                        address: ErrorCode.HARDCODE_ERR_DEFINE[asset]['NOTSTANDARD']
                                    })
                                } else {
                                    rawtx_outputs.push({
                                        asset: asset,
                                        tx_id: node['txid'],
                                        output_index: value['n'],
                                        value: value['value'],
                                        address: value['scriptPubKey']['addresses'][0]
                                    })
                                }
                            });
                            return cb()
                        })
                    },
                    function (err, results) {
                        if (err) {
                            return done(err);
                        }
                        return done(null, {rawtxs: arg1, rawtx_inputs: rawtx_inputs, rawtx_outputs: rawtx_outputs})
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

exports.persistOneBlock = function (asset, blockTxData, areturn) {
    if (!blockTxData) {
        return areturn(new MyError(ERR_SERVICE_CODE.ERR_UNKNOW, '!blockTxData'));
    }
    DBWallet.transaction(function (t) {
        return Rawtx[asset].bulkCreate(blockTxData.rawtxs, {transaction: t}).then(
            record => {
                let outputs = generate4Output(record, blockTxData);
                return Rawtx_output[asset].bulkCreate(outputs, {transaction: t}).then(record => {
                    let vinTxs = getVinTxsArr(blockTxData);
                    return Rawtx_output[asset].findAll({where: {$or: vinTxs}}).then((record) => {
                        if (!record.length) {
                            return false;
                        }
                        let inputs = generate4Input(outputs, record, blockTxData);
                        return Rawtx_input[asset].bulkCreate(inputs, {transaction: t});
                    })
                })
            }
        );
    }).then(() => {
        Logger.info('persist ok');
        return areturn();
    }).catch(e => {
        Logger.error('Failed persist Block' + e.message)
        return areturn();
    })
}

exports.getLastHeightInDB = function (asset, areturn) {
    Rawtx[asset].findAll({
        attributes: [[sequelize.fn('MAX', sequelize.col('height')), 'height']]
    }).then(record => {
        if (!record.length||!record[0]['height']) {
            return areturn(null, 0);
        }
        return areturn(null, record[0].height);
    }).catch(err => {
        Logger.error('getLastHeightInDB,error:%s', err.message);
        return areturn(err);
    });
}

function generate4Output(rawtxRecords, blockTxData) {
    let obj4db = [];
    blockTxData.rawtx_outputs.forEach((value) => {
        for (let v of rawtxRecords) {
            if (v.txid === value.tx_id) {
                obj4db.push({
                    rawtx_id: v['id'],
                    txid: v['txid'],
                    output_index: value['output_index'],
                    address: value['address'],
                    value: value['value'],
                })
            }
        }
    })
    if (obj4db.length === blockTxData['rawtx_outputs'].length) {
        return obj4db;
    } else {
        return false;
    }
}

function generate4Input(outputs, rawtxOutputRecords, blockTxData) {
    let obj4db = [];
    let outputsObj = {};
    for (let one of outputs) {
        outputsObj[one['txid']] = one['rawtx_id']
    }
    blockTxData.rawtx_inputs.forEach((value) => {
        for (let v of rawtxOutputRecords) {
            for (let vv of Object.keys(outputsObj)) {

                if (v.txid === value.tx_id && v.output_index === value.output_index && vv === value.used_txid) {

                    obj4db.push({
                        rawtx_id: outputsObj[vv],
                        previous_output_id: v['id'],
                    })
                }
            }
        }
    })
    return obj4db;
    if (obj4db.length === blockTxData['rawtx_inputs'].length) {
        return obj4db;
    } else {
        return false;
    }
}

function getVinTxsArr(blockTxData) {
    let vinTxs = [];
    blockTxData.rawtx_inputs.forEach((value) => {
        vinTxs.push({txid: value['tx_id'], output_index: value['output_index']})
    })
    return vinTxs;
}

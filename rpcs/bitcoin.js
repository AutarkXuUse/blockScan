'use strict'
let request = require('request');
const Async = require('async');
var util = require('util');
let rpcCode = require('../constance/rpccode');

const normalSyncTime = 0;//ms
const blockErrorSyncTime = 1000;//ms

function Bitcoin(config, asset) {
    this.config = config;
    this.startBlock = config.startBlock;
    this.account = config.account;
    this.passwd = config.passwd;
    this.host = config.host;
    this.port = config.port;
    this.auth = 'Basic ' + new Buffer(util.format('%s:%s', config.account, config.passwd)).toString('base64');
    this.asset = asset;
    this.handlingBlockHeight = 0;
    this.decimal = 8;
    this.idManager = {
        rawtx: 0,
        rawOutput: 0
    }
    this.nextSyncTime = 0;//ms
}

Bitcoin.prototype.start = function (areturn) {

};

Bitcoin.prototype.stop = function () {
    this.stopped = true;
};

Bitcoin.prototype.toWei = function (amount) {
    return parseFloat(amount);
};

Bitcoin.prototype.fromWei = function (amount) {
    return parseFloat(amount);
};

Bitcoin.prototype.fee = function (amount) {
    return parseFloat(amount);
};

Bitcoin.prototype._syncBestblockheightFromDB = function (areturn) {
    let pthis = this;
    Rawtx.findAll({
        attributes: [[sequelize.fn('MAX', sequelize.col('height')), 'height']]
    }).then(record => {
        if (!record[0].height) {
        pthis.handlingBlockHeight = pthis.startBlock;
        return areturn();
    }
    pthis.handlingBlockHeight = record[0].height + 1;
    return areturn();
}).catch(err => {
        Logger.error('Bitcoin._getBestblockheightFromDB,error:%s', err.toString());
    return areturn(err);
});
};

Bitcoin.prototype._sync = function (areturn) {
    if (this.stopped) {
        Logger.warn('Sync is stopped');
        return;
    }
    let pthis = this;
    Async.waterfall([
        function (done) {
            pthis._makeRequest('getblockhash', [pthis.handlingBlockHeight], (err, res) => {
                if (err) {
                    Logger.error('Bitcoin._sync.getblockhash failed,error:%s', err.toString());
                    pthis.nextSyncTime = blockErrorSyncTime;
                    return done(err);
                }
                pthis.nextSyncTime = 0;
            done(null, res.result);
        });
        },
        function (arg1, done) {
            pthis._makeRequest('getblock', [arg1], (err, res) => {
                if (err) {
                    Logger.error('Bitcoin._sync.getblock failed,error:%s', err.toString());
                    return done(err);
                }
                done(null, res.result['tx'])
        });
        },
        function (arg1, done) {
            Async.mapSeries(arg1, function (node, cb) {
                pthis._makeRequest('getrawtransaction', [node, true], function (err, res) {
                    if (err || !res.result) {
                        Logger.error('Bitcoin._sync.getblock.getrawtransaction failed,txid:%s', node);
                        return cb(err);
                    }
                    cb(null, res.result);
                })
            }, function (err, results) {
                if (err) {
                    return done(err);
                }
                done(null, results);
            })
        },
        function (arg1, done) {
            pthis._mapTxInfo2DatabaseTable(arg1, (err) => {
                if (err) {
                    Logger.error('failed');
                    return done(err);
                }
                return done();
        });
        }], function (err, result) {
        if (err) {
            Logger.error('Sync Failed! Retry Height:%d After mSeconds:%d', pthis.handlingBlockHeight, pthis.nextSyncTime);
            if (!pthis.stopped) {
                setTimeout(() => {
                    pthis._sync()
            }, pthis.nextSyncTime);
            }
            return;
        }
        pthis.nextSyncTime = normalSyncTime;
        pthis.handlingBlockHeight++;
        Logger.info("Handle NEXT block height:%d", pthis.handlingBlockHeight);

        if (!pthis.stopped) {
            setTimeout(() => {
                pthis._sync();
        }, pthis.nextSyncTime);
        }
    });
};

Bitcoin.prototype._mapTxInfo2DatabaseTable = function (rawTransactions, areturn) {
    var pthis = this;

    var txs = {};
    var txObj = {
        rawtx: {asset: this.asset},
        rawtx_input: [],
        rawtx_output: [],
    };

    let rawtxArr = [];

    let vinCons = [];

    for (var v of rawTransactions) {
        txObj.rawtx['txid'] = v['txid'];
        txObj.rawtx['height'] = this.handlingBlockHeight;
        this.idManager.rawtx++;
        rawtxArr.push({asset: this.asset, txid: v['txid'], height: this.handlingBlockHeight, id: this.idManager.rawtx});
        for (var vv of v['vout']) {
            if (vv['scriptPubKey']['type'] === 'nulldata') {
                continue;
            }

            let tempObj = {};
            tempObj['asset'] = this.asset;
            tempObj['txid'] = v['txid'];
            tempObj['output_index'] = vv['n'];
            tempObj['value'] = vv['value'].toString();
            if (!vv['scriptPubKey']['addresses']) {
                tempObj['address'] = '-1';
            }
            else {
                if (vv['scriptPubKey']['addresses'].length !== 1) {
                    Logger.warn('rawTransaction vout has not 1 address,txid:%s', v['txid']);
                }
                tempObj['address'] = vv['scriptPubKey']['addresses'][0];
            }
            txObj.rawtx_output.push(tempObj);
        }

        for (var vv of v['vin']) {
            if (!vv['txid']) {
                continue;
            }
            let tempObj = {};
            tempObj['asset'] = this.asset;
            txObj.rawtx_input.push(tempObj);

            vinCons.push({txid: vv['txid'], output_index: vv['vout']})
        }

        txs[v['txid']] = txObj;
    }

    wsSeq.transaction(function (t) {
        return Rawtx.bulkCreate(rawtxArr, {transaction: t}).then(function (rawtxRecord) {
            var rawtx_outputArr = [];
            for (var v of rawtxRecord) {
                txs[v['dataValues']['txid']].rawtx_output.forEach((item, index) => {
                    if (v['dataValues']['txid'] === item['txid']) {
                    item['rawtx_id'] = v['dataValues']['id'];
                    pthis.idManager.rawOutput++;
                    item['id'] = pthis.idManager.rawOutput;
                    rawtx_outputArr.push(item);
                }
            });
            }

            if (pthis.asset === 'Bitcoin') {
                if (pthis.height === 91842 || pthis.height === 91722) {
                    rawtx_outputArr = pthis._solveBitcoinHeight91842();
                }
            }

            return RawOutput.bulkCreate(rawtx_outputArr, {transaction: t}).then(function (rawoutputRecord) {
                //create success
                var vinRecs = [];

                if (vinCons.length === 0) {
                    Logger.warn('There is no vin tx records,height:%s', pthis.handlingBlockHeight);
                    return;
                } else {
                    Async.mapSeries(vinCons, function (node, done) {
                        RawOutput.findAll({where: node}).then(record => {
                            return done(null, record[0])
                        });
                    }, function (err, results) {
                        for (var v of results) {
                            for (vv of vinCons) {
                                if (vv.txid == v['dataValues'].txid && vv.output_index == v['dataValues'].output_index) {
                                    vinRecs.push({
                                        previous_output_id: v.id,
                                        rawtx_id: v['rawtx_id'],
                                        asset: pthis.asset
                                    })
                                }
                            }
                        }
                        if (pthis.asset === 'Bitcoin') {
                            if (pthis.height === 91842 || pthis.height === 91722) {
                                rawtx_outputArr = pthis._solveBitcoinHeight91842();
                            }
                        }
                        return RawInput.bulkCreate(vinRecs, {transaction: t});
                    });
                }

            })
        });
    }).then((result) => {
        Logger.info('****************** Successfully sync at height:%s **************', this.handlingBlockHeight);
    return areturn();
}).catch((err) => {
        Logger.error('Failed sync at height:%s', this.handlingBlockHeight);
    return areturn(err);
})
}

Bitcoin.prototype._solveBitcoinHeight91842 = function () {
    return [];
};

Bitcoin.prototype._makeRequest = function (method, params, func) {
    let uri = util.format('http://%s:%s', this.host, this.port);
    request.post(uri, {
        headers: {
            Authorization: this.auth,
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({jsonrpc: '1.0', method: method, params: params, id: 'my'}),
        timeout: 5000
    }, function (err, response, body) {
        if (err) {
            return func(err, body);
        }
        if (!body) {
            return func(new Error(response.statusMessage))
        }

        if(typeof body==='string'){
            body = JSON.parse(body)
        }

        func(err, body)
    })
};

Bitcoin.prototype.transferAvailable = function () {

};

Bitcoin.prototype.transfer = function (from, to, amount, memo, func) {
    let pthis = this;
    Async.waterfall([function (done) {
        pthis._makeRequest('sendfrom', [from, to, amount], (err, res) => {
            if (err) {
                Logger.error('Bitcoin.transfer,error msg: ', err);
                return done(rpcCode.FATAL, err);
            }
            if(res.error){
            Logger.error('Bitcoin.transfer,wallet error msg: ', res.error);
            return done(rpcCode.FATAL, res.error);
        }
        return done(null, res.result);
    })
    }, function (arg, done) {
        pthis._makeRequest('gettransaction', [arg], (err, res) => {
            if (err) {
                Logger.error('Bitcoin.gettransaction，err failed,error msg:%s', err);
                return done(err);
            }
            if (res.error) {
            Logger.error('Bitcoin.gettransaction，wallet failed,error msg:%s', res.error.message);
            return done(res.error);
        }
        let data = {
            tx_hash: arg,
            fee: Math.abs(res.result.fee)
        };
        return done(null, data);
    })
    }], (err, result) => {
        if (err) {
            return func(err,result);
        }
        return func(null, result);
});

};

Bitcoin.prototype.getBalance = function (address, func) {
    let sql = 'select sum(value) as balance from rawtx_output where rawtx_output.id not in (select rawtx_output.id from rawtx_input inner join rawtx_output on rawtx_input.previous_output_id=rawtx_output.id) and  rawtx_output.address=\'' + address + '\'';

    wsSeq.query(sql, {type: sequelize.QueryTypes.SELECT}).then((result) => {
        return func(null, {balance: parseFloat(result[0]['balance'])});
}).catch(err => {
        return func(rpcCode.ERR_DATABASE_QUERY, err);
});
};

Bitcoin.prototype.getFromBalance = function (address, func) {
    let pthis=this;
    this._makeRequest('getbalance', [address, pthis.config.minconf], (err, res) => {
        if (err) {
            Logger.error('Bitcoin.getFromBalance,error:%s', err.message);
            return func(rpcCode.FATAL, err);
        }
        if (res.error) {
        Logger.error('Bitcoin.getFromBalance,error:%s', err.message);
        return func(rpcCode.ERR_COMMAND, err);
    }
    let data = {
        balance: res.result
    };
    return func(null, data)
})
};

Bitcoin.prototype.getBestBlockHeight = function (arg,func) {
    let pthis = this;
    Async.waterfall([function (done) {
        pthis._makeRequest('getbestblockhash', [], (err, res) => {
            if (err) {
                Logger.error('Bitcoin.getbestblockhash failed,error msg', err);
                return done(rpcCode.FATAL,err);
            }
            if (res.error) {
            Logger.error('Bitcoin.getbestblockhash failed,error msg:%s', res.error.msg)
            return done(rpcCode.FATAL,res.error);
        }
        done(null, res.result);
    });
    },
        function (arg1, done) {
            pthis._makeRequest('getblock', [arg1], (err, res) => {
                if (err) {
                    Logger.error('Bitcoin.getblock failed,error msg', err);
                    return done(rpcCode.FATAL,err);
                }
                if (res.error) {
                Logger.error('Bitcoin.getblock failed,error msg:%s', res.error.msg);
                return done(rpcCode.FATAL,res.error);
            }
            let data = {
                height: res.result.height,
            };
            done(null, data);
        })
        }], function (err, result) {
        if (err) {
            return func(err,result);
        }
        return func(null, result);
    });
};

Bitcoin.prototype.getTransaction = function (h, func) {
    let pthis = this;
    Async.waterfall([function (done) {
        pthis._makeRequest('gettransaction', [h], (err, res) => {
            if (err) {
                Logger.error('Bitcoin.gettransaction，failed,error msg:%s', err);
                return func(rpcCode.FATAL, err);
            }
            if (res.error) {
            Logger.error('Bitcoin.gettransaction，failed,error msg:%s', res.error.msg);
            return func(rpcCode.FATAL,res.error);
        }
        if (!res.result.blockhash) {
            Logger.error('Bitcoin.gettransaction，failed,not a comfirmation');
            return func(rpcCode.FATAL,new Error('No confirmed block'));
        }
        let data = {
            blockhash: res.result.blockhash,
            tx_hash: res.result.txid
        };
        return done(null, data);
    })
    }, function (arg1, done) {
        pthis._makeRequest('getblock', [arg1.blockhash], (err, res) => {
            if (err) {
                Logger.error('Bitcoin.getTransaction failed,error msg', err);
                return done(rpcCode.FATAL,err);
            }
            let data = {
                height: res.result.height,
                tx_hash: arg1.tx_hash
            }
            return done(null, data);
    });
    }], function (err, result) {
        if (err) {
            return func(err,result);
        }
        return func(null, result);
    })

}

module.exports = Bitcoin;

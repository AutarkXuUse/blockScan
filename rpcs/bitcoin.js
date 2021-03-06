'use strict'
const Request = require('request');
const Async = require('async');
const Logger = require('../utils/logger');
const ERR_RPC_CODE = require('../msgdefine/msgtype').ERR_RPC_CODE;
const Helper = require('../utils/helper');
let util = require('util');

function Bitcoin(config) {
    this.rpcuser = config.rpcuser;
    this.rpcpassword = config.rpcpassword;
    this.host = config.host;
    this.port = config.port;
    this.auth = 'Basic ' + new Buffer(util.format('%s:%s', config.rpcuser, config.rpcpassword)).toString('base64');
    this.asset = config.asset;
};

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

Bitcoin.prototype._makeRequest = function (method, params, func) {
    let uri = util.format('http://%s:%s', this.host, this.port);
    Request.post(uri, {
        headers: {
            Authorization: this.auth,
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({jsonrpc: '1.0', method: method, params: params, id: 'hi,bitcoin'}),
        timeout: 5000
    }, function (err, response, body) {
        if (err) {
            return func(err, body);
        }
        if (!body) {
            return func(new Error(response.statusMessage))
        }

        if (typeof body === 'string') {
            body = JSON.parse(body)
        }

        func(err, body)
    })
};

Bitcoin.prototype.getBestBlockHeight = function (func) {
    let pthis = this;
    Async.waterfall([
            function (done) {
                pthis._makeRequest('getbestblockhash', [], (err, res) => {
                    if (err) {
                        Logger.error('Bitcoin.getbestblockhash failed,error msg:%s', err.message);
                        return done(new MyError(ERR_RPC_CODE.ERR_CONN_RETURN, err.message));
                    }
                    if (res.error) {
                        Logger.error('Bitcoin.getbestblockhash failed,res.error msg:%s', res.error.message)
                        return done(new MyError(ERR_RPC_CODE.ERR_WALLET_RETURN, res.error.message));
                    }
                    done(null, res.result);
                });
            },
            function (arg1, done) {
                pthis._makeRequest('getblock', [arg1], (err, res) => {
                    if (err) {
                        Logger.error('Bitcoin.getblock failed,error msg:%s', err.message);
                        return done(new MyError(ERR_RPC_CODE.ERR_CONN_RETURN, err.message));
                    }
                    if (res.error) {
                        Logger.error('Bitcoin.getblock failed,error msg:%s', res.error.message);
                        return done(new MyError(ERR_RPC_CODE.ERR_WALLET_RETURN, res.error.message));
                    }
                    done(null, res.result.height);
                })
            }],
        function (err, result) {
            if (err) {
                return func(err, result);
            }
            return func(null, result);
        });
};

Bitcoin.prototype.getrawtransaction = function (tx, areturn) {
    this._makeRequest('getrawtransaction', [tx, 1], (err, res) => {
        if (err) {
            Logger.error('Bitcoin.getrawtransaction,failed error,msg:%s', err.message);
            return areturn(new MyError(ERR_RPC_CODE.ERR_CONN_RETURN, err.message));
        }
        if(res.error){
            Logger.error('Bitcoin.getblock failed,res.error msg:%s', res.error.message);
            return areturn(new MyError(ERR_RPC_CODE.ERR_WALLET_RETURN, res.error.message));
        }
        return areturn(null,res.result);
    })
};

Bitcoin.prototype.getBlockHashByheight=function (height,areturn) {
    this._makeRequest('getblockhash',[height],(err,res)=>{
        if(err){
            Logger.error('Bitcoin.getBlockHashByheight,failed error,msg:%s', err.message);
            return areturn(new MyError(ERR_RPC_CODE.ERR_CONN_RETURN, err.message));
        }
        if(res.error){
            Logger.error('Bitcoin.getBlockHashByheight failed,res.error msg:%s', res.error.message);
            return done(new MyError(ERR_RPC_CODE.ERR_WALLET_RETURN, res.error.message));
        }
        return areturn(null,res.result);
    })
};

Bitcoin.prototype.getBlockInfo=function(hash,areturn){
    this._makeRequest('getblock',[hash],(err,res)=>{
        if(err){
            Logger.error('Bitcoin.getBlockInfo,failed error,msg:%s', err.message);
            return areturn(new MyError(ERR_RPC_CODE.ERR_CONN_RETURN, err.message));
        }
        if(res.error){
            Logger.error('Bitcoin.getBlockInfo failed,res.error msg:%s', res.error.message);
            return areturn(new MyError(ERR_RPC_CODE.ERR_WALLET_RETURN, res.error.message));
        }
        return areturn(null,res.result);
    })
};

module.exports = Bitcoin;
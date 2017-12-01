'use strict'
const Request = require('request');
const Async = require('async');
const Logger=require('../utils/logger');
let util = require('util');
let ERR_RPC_CODE = require('../msgdefine/msgtype').ERR_RPC_CODE;

function Bitcoin(config, asset) {
    this.account = config.account;
    this.passwd = config.passwd;
    this.host = config.host;
    this.port = config.port;
    this.auth = 'Basic ' + new Buffer(util.format('%s:%s', config.account, config.passwd)).toString('base64');
    this.asset = asset;
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

        if(typeof body==='string'){
            body = JSON.parse(body)
        }

        func(err, body)
    })
};

Bitcoin.prototype.getBestBlockHeight = function (arg,func) {
    let pthis = this;
    Async.waterfall([function (done) {
        pthis._makeRequest('getbestblockhash', [], (err, res) => {
            if (err) {
                Logger.error('Bitcoin.getbestblockhash failed,error msg', err);
                return done(ERR_RPC_CODE.FATAL,err);
            }
            if (res.error) {
            Logger.error('Bitcoin.getbestblockhash failed,error msg:%s', res.error.msg)
            return done(ERR_RPC_CODE.FATAL,res.error);
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

Bitcoin.prototype.getrawtransaction=function(tx,areturn){
    let pthis=this;
    this._makeRequest('getrawtransaction',[tx,1],(err,res)=>{
      if(err){
          Logger.error('Bitcoin.getrawtransaction,failed error,msg:%s',err.msg);
          return areturn(err);
      }

    })
}

Bitcoin.prototype.getTransaction = function (h, func) {
    let pthis = this;
    Async.waterfall([function (done) {
        pthis._makeRequest('gettransaction', [h], (err, res) => {
            if (err) {
                Logger.error('Bitcoin.gettransaction,failed,error msg:%s', err);
                return func(rpcCode.FATAL, err);
            }
            if (res.error) {
            Logger.error('Bitcoin.gettransaction,failed,error msg:%s', res.error.msg);
            return func(rpcCode.FATAL,res.error);
        }
        if (!res.result.blockhash) {
            Logger.error('Bitcoin.gettransaction,failed,not a comfirmation');
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

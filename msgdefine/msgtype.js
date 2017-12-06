'use strict'
exports.ERR_RPC_CODE = {
    ERR_UNKNOW: 1000,
    ERR_WALLET_RETURN: 1001,
    ERR_CONN_RETURN: 1002,
    ERR_TX_NOT_CONFIRMED: 1003,
}

exports.ERR_SERVICE_CODE = {
    ERR_UNKNOW: 2001,
    ERR_HEIGHT_NULL: 2001,
    ERR_HASH_NULL: 2002,
    ERR_HASH_NOT_EQUAL: 2003,

}

exports.HARDCODE_ERR_DEFINE = {
    BTC: {NOTSTANDARD: -1,}
}

exports.ERR_OTHER = {}

global.MyError = function (code, message) {
    this.code = code;
    this.message = message
}
'use strict'
const Bitcoin=require('./bitcoin');
const Config=require('../config/rpc_config').BTC;
const Util=require('util');

let BTC=function () {
    Bitcoin.call(this,Config);
}

Util.inherits(BTC,Bitcoin);

module.exports=BTC;
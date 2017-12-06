'use strict'
const Bitcoin=require('./bitcoin');
const Config=require('../config/rpc_config').LTC;
const Util=require('util');

let LTC=function () {
    Bitcoin.call(this,Config);
}

Util.inherits(LTC,Bitcoin);

module.exports=new LTC();
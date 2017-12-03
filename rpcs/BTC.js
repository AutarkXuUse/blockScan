'use strict'
const Bitcoin=require('./bitcoin');
const Config=require('../rpc_config').BTC;

let BTC=function (Config) {
    Bitcoin.call(this,Config)
}
'use strict'
let Bitcoin=require('../../rpcs/bitcoin');

let btcConf={
    rpcuser:123,
    rpcpassword:123,
    host:'127.0.0.1',
    port:8332,
    asset:'BTC'
}

let BTC=new Bitcoin(btcConf);

BTC.getBestBlockHeight(function (err,result) {
    if(err){
        console.log('getBestBlockHeight,err:'+err);
        return;
    }
    console.log(result);
})

BTC.getrawtransaction('e4a6f293fd343c7068440083a7525803a5a22c0678b8fb928eff1b0d3d1615a2',function (err,result) {
    if(err){
        console.log('getBestBlockHeight,err:'+err);
        return;
    }
    console.log(result);
})


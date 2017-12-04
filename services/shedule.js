'use strict'
const ERR_SERVICE_CODE = require('../msgdefine/msgtype').ERR_SERVICE_CODE;
const Rpc = require('../rpcs/BTC');
const Async = require('async');

function getOneBlock4DB(height, areturn) {
    if (!height) {
        return areturn(new MyError(ERR_SERVICE_CODE.ERR_HEIGHT_NULL, '!height'))
    }


    Async.waterfall([
            function (done) {
                Rpc.getBlockHashByheight(height, (err, result) => {
                    if (err) {
                        return areturn(err);
                    }
                    return done (0,result)
                })
            },
            function (arg1,done) {
                Rpc.getBlockInfo()
            }
        ],
        function () {

        })

}
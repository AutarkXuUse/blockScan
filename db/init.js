'use strict'
const Rawtx = require('./models/rawtx');
const Rawtx_output = require('./models/rawtx_output');
const Rawtx_input = require('./models/rawtx_input');
const Async = require('async');
const Config = require('../config');
const Logger = require('../utils/logger');
let DBWallet = require('./connect').DBWallet;

exports.initOrm = function (areturn) {
    Async.map(Config.supportAssets, function (node, callback) {
            Async.parallel([
                    function (done) {
                        Rawtx[node].sync().then(() => {
                            return done()
                        }).catch((err) => {
                            return done(err)
                        });
                    },
                    function (done) {
                        Rawtx_input[node].sync().then(() => {
                            return done()
                        }).catch((err) => {
                            return done(err)
                        });
                    },
                    function (done) {
                        Rawtx_output[node].sync().then(() => {
                            return done()
                        }).catch((err) => {
                            return done(err)
                        });
                    }
                ],
                (err) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback();
                })
        },
        function (err) {
            if (err) {
                Logger.error('Model sync fail');
                return areturn(err);
            }
            return areturn();
        })

}

require('./init').initOrm(err => {
    console.log(err)
})

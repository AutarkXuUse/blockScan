'use strict'
const Rawtx = require('./models/rawtx');
const Rawtx_output = require('./models/rawtx_output');
const Rawtx_input = require('./models/rawtx_input');
const Async = require('async');
const Config = require('../config');
const Logger=require('../utils/logger');

exports.initOrm = function (areturn) {
    Async.eachSeries(Config.supportAssets, function (node, callback) {
            Async.series([
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
                Logger.error('Model sync fail asset:%s', node);
                return areturn(err);
            }
            return areturn();
        })

}
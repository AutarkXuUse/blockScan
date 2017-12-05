'use strict'
let serverName = 'blockScan'
process.title = serverName;

const Config = require('./config');
const Rawtx = require('./db/models/rawtx');

function initGlobal() {
    Config.supportAssets.forEach((value, index, arr) => {
        Rawtx[value].findAll(
            {
                where: {
                    asset: value,
                },
                order: 'id DESC',
                limit: 1
            }
        ).then(record => {
            if (record.length === 0) {
                global.rawtx_id = {value: 0};
            } else {
                global.rawtx_id = {value: record[0].id};
            }
            return true;
        }).catch(err => {
            return false;
        });
    })
}



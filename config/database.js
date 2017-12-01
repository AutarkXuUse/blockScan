'use strict'

exports.database = {
    connection: {
        host: 'localhost',
        dialect: 'mysql',
    },
    database: 'block_scan',
    userName: 'root',
    password: '123456',
}

Object.assign(module.exports, exports);

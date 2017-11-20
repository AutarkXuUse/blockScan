'use strict'

const DBConfig = require('../config/database').database;
const Sequelize = require('sequelize');


const DBWallet = new Sequelize(
    DBConfig.database,
    DBConfig.userName,
    DBConfig.password,
    DBConfig.connection
);

//test connection
DBWallet
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports={
    DBWallet:DBWallet,
}
Object.assign(module.exports, exports);

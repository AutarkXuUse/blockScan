'use strict';
let sequelize = require('sequelize');
let Config=require('../../config');
const DBWallet = require('../connect').DBWallet;

let rawtx_table = {
	id: {
		type: sequelize.BIGINT,
		autoIncrement: false,
		unique:true,
		primaryKey: true,
	},
	asset: {
		type: sequelize.STRING,
		allowNull: false
	},
	height: {
		type: sequelize.BIGINT,
		allowNull: true
	}
	,
	txid: {
		type: sequelize.STRING,
		allowNull: false,
	},
};

let rawtx={}

for(let v of Config.supportAssets){
    rawtx[v] = DBWallet.define(v+'_rawtx', rawtx_table,{freezeTableName: true,});
}

module.exports = rawtx;

'use strict';
let sequelize = require('sequelize');
let DBWallet = require('../connect').DBWallet;

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

let rawtx = DBWallet.define('rawtx', rawtx_table,{freezeTableName: true,});

module.exports = rawtx;

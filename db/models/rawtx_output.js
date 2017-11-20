'use strict';
let sequelize = require('sequelize');
let DBWallet = require('../connect').DBWallet;

let tx_output_table = {
	id: {
		type: sequelize.BIGINT,
		autoIncrement: false,
		unique: true,
		primaryKey: true,
	},
	rawtx_id: {
		type: sequelize.BIGINT,
		unique: false,
		allowNull: false
	},
	asset: {
		type: sequelize.STRING,
		allowNull: false
	},
	txid: {
		type: sequelize.STRING,
		allowNull: false,
		unique: 'uq_k_store'
	},
	output_index: {
		type: sequelize.BIGINT,
		allowNull: false,
		unique: 'uq_k_store'
	},
	address: {
		type: sequelize.STRING,
		allowNull: false
	},
	value: {
		type: sequelize.STRING,
		allowNull: false
	}
};

let rawtx_output = DBWallet.define('rawtx_output', tx_output_table, {
	freezeTableName: true,
	indexes: [
		{
			unique: true,
			fields: ['txid','output_index']
		},

		{
			unique: false,
			fields: ['address']
		}
	]
});

module.exports = rawtx_output;

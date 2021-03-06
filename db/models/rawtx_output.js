'use strict';
let sequelize = require('sequelize');
let DBWallet = require('../connect').DBWallet;
let Config=require('../../config/config');

let tx_output_table = {
	id: {
		type: sequelize.BIGINT,
		autoIncrement: true,
		unique: true,
		primaryKey: true,
	},
	rawtx_id: {
		type: sequelize.BIGINT,
		allowNull: false,
        unique: 'uq_k_store'
    },
	txid: {
		type: sequelize.STRING,
		allowNull: false,
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

let rawtx_output={}
for(let v of Config.supportAssets){
    rawtx_output[v] = DBWallet.define(v+'_rawtx_output', tx_output_table, {
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
}

module.exports = rawtx_output;

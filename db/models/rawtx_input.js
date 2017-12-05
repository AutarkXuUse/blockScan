'use strict';
let sequelize = require('sequelize');
let DBWallet = require('../connect').DBWallet;
let Config=require('../../config');


let tx_input_table = {
	id: {
		type: sequelize.BIGINT,
		autoIncrement: true,
		primaryKey: true,
	},
	rawtx_id: {
		type: sequelize.BIGINT,
		allowNull: false,
		unique: false,
	},
	previous_output_id: {
		type: sequelize.BIGINT,
		allowNull: false //todo should be foreign key
	}

};

let rawtx_input={}
for(let v of Config.supportAssets){
    rawtx_input[v] = DBWallet.define(v+'_rawtx_input', tx_input_table, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ['previous_output_id']
            },
        ]
    });
}

module.exports = rawtx_input;

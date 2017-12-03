'use strict'
const ERR_SERVICE_CODE = require('../msgdefine/msgtype').ERR_SERVICE_CODE;

function getOneBlock4DB(height,areturn) {
    if(!height){
        return areturn(new MyError(ERR_SERVICE_CODE.ERR_HEIGHT_NULL,'!height'))
    }

    
}
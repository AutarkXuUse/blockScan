'use strict'
/*
 {
 "type": "file",//输出类型
 "filename": "./logs/test.log",//输出文件路径
 "pattern": "-yyyy-MM-dd-hh.log",//输出文件名格式，接在filename后面
 "category":"game"  //日志tag
 }

 文件日志等级：
 由低到高：ALL->TRACE->DEBUG->INFO->WARN->ERROR->FATAL->OFF

 * */

let log4js = require('log4js');

log4js.configure({
    "replaceConsole": true,

    "appenders": {
        fileLog: {
            "type": "dateFile",
            "filename": "./logs/" + process.title,
            "pattern": "_yyyy_MM_dd.log",
            "alwaysIncludePattern": true,
        },
        errorLog: {
            "type": "dateFile",
            "filename": "./logs/error/" + process.title+'.error',
            "pattern": "_yyyy_MM_dd.log",
            "alwaysIncludePattern": true,
        },
        onlyError: {type: 'logLevelFilter', appender: 'errorLog', level: 'error'},
        out: {type: 'console'}
    },
    "categories": {
        default: {appenders: ['out', 'fileLog','onlyError'], level: 'info'}
    }

});
var logger = log4js.getLogger(process.title);
//logger.setLevel(logLevel);

// console.log('log level:', logLevel);

module.exports = logger;
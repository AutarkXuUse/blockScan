'use strict'

var createTestSuite = require('mocha').describe;
var createTestCase = require('mocha').it;
var initTestSuite = require('mocha').before;
var initTestCase = require('mocha').beforeEach;
var unInitTestSuite = require('mocha').after;
var unInitTestCase = require('mocha').afterEach;
var should = require('should');
var Async = require('async');

let rawtx=require('../../db/models/rawtx.test');

createTestSuite('rawtx model test',function () {

    var testData={
        asset:'BBBB',
        rawtxid:'testtxid8888',
        height:'999999999',
    }

    var updateData='CCCC';

    createTestCase('read test',function () {
        rawtx.findAll().then((record)=>{

        }).catch((err)=>{
            (!!err).should.be.true();
        });
    });
    createTestCase('write test',function () {
        rawtx.create(testData).then((instance)=>{

        }).catch((err)=>{
            (!!err).should.be.true();
        });
    });
    createTestCase('update test',function () {
        rawtx.update(updateData,{where:{asset:'BBBB'}}).then((record)=>{

        }).catch((err)=>{
            (!!err).should.be.true();
        });
    });
    createTestCase('delete test',function () {
        rawtx.destroy({where:{asset:'CCCC'}}).then((rows)=>{
            rows.should.be.equal(1);
        }).catch((err)=>{
            (!!err).should.be.true();
        });
    });
});
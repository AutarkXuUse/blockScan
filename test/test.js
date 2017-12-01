let async=require('async')
var q = async.queue(function (obj,cb) {

    setTimeout(function () {
        console.log(obj);
        cb();
    },obj.time)
},1)

for (var i = 0; i<100; i++) {
    console.log(1);

    q.push({name:i,time:i*1000},function (err) {

        console.log(err);
    })
};

for (var i = 0; i<100; i++) {
    console.log(2);
    q.push({name:1,time:1000},function (err) {
        console.log(err);
    })
};
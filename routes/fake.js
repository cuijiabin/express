var express = require('express');
var router = express.Router();

var db = require('monk')('localhost:27017/rap');
var Q = require('q');

router.get('/', function (req, res, next) {
    var actionId = req.query.actionId;
    if(actionId){
        var query = {"actionId": parseInt(actionId)};
        var collection = db.get('my_rap');

        var defer = Q.defer();
        collection.findOne(query,function(e, docs){
            defer.resolve(docs);
        });
        defer.promise.then(function(data){
            res.render('fake_list', {
                title: '接口假数据',
                g_project: data,
                responseParam:JSON.stringify(data.responseParam)
            });
        });
    }else{
        res.send('参数actionId不得为空');
    }
});


router.get('/list', function (req, res) {

    var actionId = req.query.actionId;
    var currentPage = req.query.currentPage ? parseInt(req.query.currentPage) : 1;

    var collection = db.get('fake_data');
    var query = {"actionId": parseInt(actionId)};

    var return_param={
        "currentPage":currentPage
    };

    //统计数量
    var count = function(query){
        var defer = Q.defer();
        collection.count(query,function(err,count){
            if(err){
                defer.reject();
            }else{
                defer.resolve(count);
            }
        });
        return defer.promise;
    };

    var count_promise = count(query);

    count_promise.done(function(count){
        return_param.totalNum = count;
        collection.find(query, {skip: (currentPage - 1)*30,limit: 30}, function (e, docs) {
            return_param.list = docs;
            res.render('json', {
                list: JSON.stringify(return_param)
            });
        });
    });

    count_promise.fail(function(){
        return_param.totalNum = 0;
        res.render('json', {
            list: JSON.stringify(return_param)
        });
    });

});

module.exports = router;

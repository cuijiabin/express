var express = require('express');
var router = express.Router();

var db = require('monk')('localhost:27017/rap');
var Q = require('q');
var ObjectId = require('mongodb').ObjectID;

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
        collection.find(query, {sort:{"order":1},skip: (currentPage - 1)*30,limit: 30}, function (e, docs) {
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

//新增假数据
router.all("/add",function(req,res){
    var jsonData = req.query.jsonData;
    var actionId = parseInt(jsonData.actionId);
    var order = parseInt(jsonData.order);
    jsonData.actionId = actionId;
    jsonData.order = order;

    var collection = db.get('fake_data');
    var param = {"actionId":actionId,"order":order}

    //TODO 编辑或者新增检查

    if(jsonData._id){
        collection.update(param,jsonData).then(function(r) {
            res.render('json', {
                list: JSON.stringify(r)
            });
        });
    }else{
        collection.insert(jsonData).then(function(r) {
            res.render('json', {
                list: JSON.stringify(r)
            });
        });
    };

});

router.get("/del",function(req,res){
    var uniq_id = req.query.uniq_id;
    var collection = db.get('fake_data');

    collection.remove({"_id":ObjectId(uniq_id)}).then(function(){
        res.render('json', {
            list: "删除成功"
        });
    });
});

router.get("/test",function(req,res){
    var actionId = parseInt(req.query.actionId);
    var order = parseInt(req.query.order);

    var collection = db.get('fake_data');
    collection.findOne({"actionId":actionId,"order":order}).then(function(data){
        var r = {};
        if(data.responseParam){
            r = data.responseParam;
        };
        res.render('json', {
            list: JSON.stringify(r)
        });
    });
});

module.exports = router;

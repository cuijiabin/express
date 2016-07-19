var express = require('express');
var router = express.Router();

var monk = require('monk');
var db = monk('localhost:27017/rap');

router.get('/', function (req, res, next) {
    res.render('index', {title: '小智云rap导航'});
});

router.get('/json', function (req, res) {

    var serviceId = req.query.serviceId;
    console.log(serviceId);
    var currentPage = req.query.currentPage ? parseInt(req.query.currentPage) : 1;

    var collection = db.get('my_rap');
    var query = {"serviceId":{$regex: serviceId}};
    if(/.*[\u4e00-\u9fa5]+.*$/.test(serviceId)){
        query = {"actionName":{$regex: serviceId}};
    }

    var return_param={
        "currentPage":currentPage
    }

    collection.count(query,function(err,count){
        if(err){
            return_param.totalNum = 0;
            res.render('json', {
                list: JSON.stringify(return_param)
            });
        }else{
            return_param.totalNum = count;
            collection.find(query, {skip: (currentPage - 1)*30,
                limit: 30}, function (e, docs) {
                return_param.list = docs;
                res.render('json', {
                    list: JSON.stringify(return_param)
                });
            });
        }
    });

});

module.exports = router;

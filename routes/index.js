var express = require('express');
var router = express.Router();

var monk = require('monk');
var db = monk('localhost:27017/rap');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: '小智云rap导航'});
});

/* GET Userlist page. */
router.get('/rap/:service_id?', function (req, res) {
    //var service_id = req.params.service_id;
    var str_param = req.query.param;
    var service_id = "";
    try {
        service_id = JSON.parse(str_param).serviceId;
    }
    catch (e) {
        console.log("entering catch block");
        console.log(e);
        console.log("leaving catch block");
        service_id = "";
    }
    console.log(service_id);
    var collection = db.get('my_rap');
    if (service_id) {
        collection.findOne({"serviceId": service_id}, {}, function (e, docs) {
            res.render('rap', {
                title: "rap",
                list: JSON.stringify(docs)
            });
        });
    } else {
        collection.findOne({}, {}, function (e, docs) {
            res.render('rap', {
                title: "rap",
                list: JSON.stringify(docs)
            });
        });
    }
});

/* GET Userlist page. */
router.get('/json', function (req, res) {

    var serviceId = req.query.serviceId;
    var currentPage = req.query.currentPage ? parseInt(req.query.currentPage) : 1;

    var collection = db.get('my_rap');
    var query = {"serviceId":{$regex: serviceId}};

    var return_param={
        "currentPage":currentPage
    }

    collection.count(query,function(err,count){
        console.log("err:"+err);
        console.log("count:"+count);
        if(err){
            return_param.totalNum = 0;
            res.render('json', {
                list: JSON.stringify(return_param)
            });
        }else{
            return_param.totalNum = count;
            collection.find({"serviceId":{$regex: serviceId}}, {skip: (currentPage - 1)*30,
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

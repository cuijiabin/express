var express = require('express');
var router = express.Router();

var db = require('monk')('localhost:27017/rap');
var Q = require('q');

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '123456',
    database : 'rap_db'
});

connection.connect();

var action_sql = "SELECT p.id AS pId,p.name AS pName,a.id AS aId,a.name AS aName"
    + " FROM tb_project p"
    + " JOIN tb_module m ON m.project_id = p.id"
    + " JOIN tb_page p2 ON p2.module_id = m.id"
    + " JOIN tb_action_and_page ap ON ap.page_id = p2.id"
    + " JOIN tb_action a ON a.id = ap.action_id";

connection.query(action_sql, function(err, rows, fields) {
    if (err) throw err;

    console.log('The rows is: ', rows[0]);
    console.log('The fields is: ', fields);
});

connection.end();

router.get('/', function (req, res, next) {
    res.render('index', {title: '小智云rap导航'});
});

router.get('/json', function (req, res) {

    var serviceId = req.query.serviceId;
    var currentPage = req.query.currentPage ? parseInt(req.query.currentPage) : 1;

    var collection = db.get('my_rap');
    var query = {"serviceId":{$regex: serviceId}};
    if(/.*[\u4e00-\u9fa5]+.*$/.test(serviceId)){
        query = {"actionName":{$regex: serviceId}};
    }else if(serviceId && !isNaN(parseInt(serviceId))){
        query = {"actionId": parseInt(serviceId)};
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

//参数编辑
router.get('/edit',function(req,res){
    var actionId = req.query.actionId;
    var query = {"actionId": parseInt(actionId)};
    var collection = db.get('my_rap');

    var defer = Q.defer();
    collection.findOne(query,function(e, docs){
        defer.resolve(docs);
    });

    defer.promise.then(function(data){
        res.render('json', {
            list: JSON.stringify(data)
        });
    });
});

router.get('/edit_tool',function(req,res){
    var actionId = req.query.actionId;
    res.render('edit_json', {
        actionId: actionId,
        title: '编辑'
    });
});

router.all("/update",function(req,res){
    var jsonData = req.query.jsonData;
    var actionId = parseInt(jsonData.actionId);
    jsonData.actionId = actionId;

    delete jsonData._id;

    var collection = db.get('my_rap');
    collection.update({"actionId":actionId},jsonData,function(){
        res.render('json', {
            list: "修改成功"
        });
    });
});

module.exports = router;

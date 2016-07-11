# coding=gbk
from collections import Iterable
import multiprocessing
import logging
import time
from pymongo import MongoClient
from mysql2mongo import Mysql2Mongo

# REQUEST_SQL = "SELECT p.id, p.name, p.identifier, p.data_type FROM tb_parameter p WHERE p.id IN (SELECT parameter_id FROM tb_request_parameter_list_mapping WHERE action_id=?)";
# RESPONSE_SQL = "SELECT p.id, p.name, p.identifier, p.data_type FROM tb_parameter p WHERE p.id IN (SELECT parameter_id FROM tb_response_parameter_list_mapping WHERE action_id=?)";
# PARAM_MAP_SQL = "SELECT p.id, p.name, p.identifier, p.data_type FROM tb_parameter p WHERE p.id IN (SELECT parameter_id FROM tb_complex_parameter_list_mapping WHERE complex_parameter_id=?)";
# SELECT p.id,p.name, a.`name`,a.id FROM tb_project p JOIN tb_module m ON m.project_id = p.id JOIN tb_page p2 ON p2.module_id = m.id JOIN tb_action_and_page ap ON ap.page_id = p2.id JOIN tb_action a ON a.id = ap.action_id ORDER BY a.id;

class GenerateMongo(object):
    mongo_host = "localhost"
    mongo_port = 27017
    mongo = None
    mongodb = None

    def __init__(self):
        # self.logger = logger
        self.mongo = MongoClient(host=self.mongo_host, port=self.mongo_port)
        self.mongodb = self.mongo["rap"]

    def get_req_param(self,action_id=155):
        req = self.mongodb["tb_request_parameter_list_mapping"].find({"action_id": action_id},{"parameter_id":1,"_id": 0})
        req_arr = list(map(lambda x: x["parameter_id"], req))
        param = self.mongodb["tb_parameter"].find({"id": {"$in": req_arr}})
        return list(map(lambda x: {"id": x["id"], "name": x["name"], "identifier": x["identifier"], "data_type": x["data_type"]},param))

    def get_res_param(self,action_id=155):
        res = self.mongodb["tb_response_parameter_list_mapping"].find({"action_id": action_id},{"parameter_id":1,"_id": 0})
        res_arr = list(map(lambda x: x["parameter_id"], res))
        param = self.mongodb["tb_parameter"].find({"id": {"$in": res_arr}})
        return list(map(lambda x: {"id": x["id"], "name": x["name"], "identifier": x["identifier"], "data_type": x["data_type"]},param))

    def get_complex_param(self,complex_parameter_id=7981):
        complex = self.mongodb["tb_complex_parameter_list_mapping"].find({"complex_parameter_id": complex_parameter_id},{"parameter_id":1,"_id": 0})
        complex_arr = list(map(lambda x: x["parameter_id"], complex))
        param = self.mongodb["tb_parameter"].find({"id": {"$in": complex_arr}})
        return list(map(lambda x: {"id": x["id"], "name": x["name"], "identifier": x["identifier"], "data_type": x["data_type"]},param))

    def recursion_param(self,param):
        map={}
        for p in param:
            data_type = p["data_type"]
            identifier = p["identifier"]
            if (not data_type == "object" and not data_type == "array<object>"):
                map[identifier] = p["name"]
            elif (data_type == "object"):
                sub_param = self.get_complex_param(p["id"])
                sub_map = self.recursion_param(sub_param);
                map[identifier] = sub_map
            elif (data_type == "array<object>"):
                sub_param = self.get_complex_param(p["id"])
                sub_map = self.recursion_param(sub_param);
                map[identifier] = [sub_map]
        return map

    def insert_mongo(self,doc):
        self.mongodb["my_rap"].insert(doc)

    def __del__(self):
        self.mongo.close()


def batch_precess(action_map):
    try:
        gm = GenerateMongo()
        action_id = action_map["actionId"]
        req_list = gm.get_req_param(action_id)
        req_param = gm.recursion_param(req_list)

        res_list = gm.get_res_param(action_id)
        res_param = gm.recursion_param(res_list)

        action_map["requestParam"] = req_param
        action_map["responseParam"] = res_param
        try:
            action_map["serviceId"] = req_param["serviceId"]
        except Exception:
            action_map["serviceId"] = ""

        gm.insert_mongo(action_map)
    except Exception as e:
        print("操作失败",action_map)

if __name__ == "__main__":
    # projectId actionId serviceId requestParam responseParam

    multiprocessing.log_to_stderr()
    logger = multiprocessing.get_logger()
    logger.setLevel(logging.INFO)
    m2m = Mysql2Mongo(logger)
    m2m.drop_collection("my_rap")

    actions = m2m.show_actions()
    t1 = time.time()
    for t in actions:
       batch_precess(t)

    print("耗费时间cost:", time.time() - t1)
// [START memorystore_server_js]
'use strict';
const http = require('http');
const redis = require('redis');

const REDISHOST = process.env.REDISHOST || '10.223.15.115';
const REDISPORT = process.env.REDISPORT || 6379;

const client = redis.createClient(REDISPORT, REDISHOST);

client.on('error', err => console.error('ERR:REDIS:', err));
global.resObj = {"response_cd":"", "op_str":""};

// create a server
http
  .createServer((req, res) => {
    redis_ops(req, res);
    //console.log ("INFO:: " + global.resObj.response_cd + "###" + global.resObj.op_str);
    res.writeHead(global.resObj.response_cd, {'Content-Type': 'text/plain'});
    res.end("I am done." + global.resObj.op_str);
  })
  .listen(8080);

function redis_ops (req, res) {
  var latency_us, hrtime_local, start_ts, end_ts;
  global.resObj.op_str = "======= RESULTS ========\n";
  
  // Get Hotel Name
  exec_redis_op("getex", "large_value_key");
  
  // Get current visit counter
  exec_redis_op("getex", "visits");
  
  // increment the visit counter
  exec_redis_op("incr", "visits");
  
  global.resObj.response_cd = 200;
}

function exec_redis_op(op_name, key_id) {
  var latency_us, hrtime_local, start_ts, end_ts;

  hrtime_local = process.hrtime();
  start_ts = (hrtime_local[0] * 1000000) + (hrtime_local[1] / 1000);  
  console.log ("INFO:: Starting " + op_name + " command for key_id: " + key_id);
  
    if (op_name == "getex") {
      client.getex(key_id, (err, reply) => {
        if (err) {
          console.log(err);
          global.resObj.response_cd = 500;
          global.resObj.op_str += err.message;
          return;
        }
        global.resObj.op_str += "Extracted key_id: " + key_id + " => " + reply + "\n";
        //console.log ("INFO:: Extracted key_id: " + key_id + " => " + reply);
      });
    }
    else if (op_name == "incr") {
      client.incr(key_id, (err, reply) => {
        if (err) {
          console.log(err);
          global.resObj.response_cd = 500;
          global.resObj.op_str += err.message;
          return;
        }
        global.resObj.op_str +=  "Incremented key_id: " + key_id + " => " + reply + "\n";
        //console.log ("INFO:: Incremented key_id: " + key_id + " => " + reply);
      });
    }

  hrtime_local = process.hrtime();
  end_ts = (hrtime_local[0] * 1000000) + (hrtime_local[1] / 1000);
  latency_us = end_ts - start_ts;
  console.log ("INFO:: Latency for " + op_name + " command (in microseconds) = " + latency_us);
}


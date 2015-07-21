/*jslint nomen: true */
/*jslint node:true */
/*jslint vars: true */
/*jslint es5: true */

/*eslint-env node */
/*eslint quotes: [2, "single"], curly: 2*/

'use strict';

var request = require('request');
var Promise = require('bluebird');
var amqp = require('amqplib');
var when = require('when');
//var email = require('emailjs');
var serialize = require('node-serialize');
var server = require('../cdlibjs/lib/server.js');
var email = require('../cdlibjs/lib/email.js');
var util = require('../cdlibjs/lib/cdutils.js');
var rabbitmq = require('../cdlibjs/lib/rabbitmq.js');

//var cdlib = require('cdlib');

//exports.checkLocation = server.checkLocation;
exports.getRedisAddress = server.getRedisAddress;
exports.getRabbitMQAddress = server.getRabbitMQAddress;
exports.msgEmail = email.msgEmail;
exports.sendEmailHtml = email.sendEmailHtml;
exports.sendEMailToRabbit = rabbitmq.sendEMailToRabbit;
exports.rabbitMQ = rabbitmq.rabbitMQ;

exports.sendRMQWorker = function (rabbitMQ, message) {
    amqp.connect(rabbitMQ.rabbitMQAuthString()).then(function (conn) {
        return when(conn.createChannel().then(function (ch) {
            var q = rabbitMQ.queue,
                ok = ch.assertQueue(q, {
                    'durable': true
                });

            return ok.then(function () {
                var msg = process.argv.slice(2).join(' ') || message;
                //ch.sendToQueue(q, new Buffer(msg), {deliveryMode: true, expiration: 1000});
                ch.sendToQueue(q, new Buffer(msg), {
                    deliveryMode: true
                });
                //console.log(" [x] Sent '%s'", msg);
                return ch.close();
            });
        })).ensure(function () {
            conn.close();
        });
    }).then(null, console.warn);
};



// promise - getOldNumerous

var getOldNumerous = function (appKey) {
    return new Promise(function (resolve, reject) {

        request({

            headers: {
                'Authorization': 'Basic <secret>'
            },
            url: 'https://api.numerousapp.com/v1/metrics/' + appKey,
            method: 'GET'
        }, function (error, response, body) {
            //console.log(error);
            //console.log(response);
            //console.log(JSON.parse(response));

            if (response.statusCode !== 200) {
                //console.log(error);
                console.log(response);
                reject(error);
            } else {

                var data = JSON.parse(body).value;
                console.log(data);
                resolve(data);
            }
        });
    });
};

// promise - updateNumerousKey

var updateNumerousKey = function (appKey, value, auth) {
    return new Promise(function (resolve, reject) {
        request({
            headers: {
                'Authorization': +auth
            },
            url: 'https://api.numerousapp.com/v1/metrics/' + appKey + '/events',
            method: 'POST',
            body: '{"value": "' + value + '"}'

        }, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });

    });
};


exports.updateNumerous = function (appID, value) {
    return new Promise(function (resolve, reject) {

        var success = '';

        getOldNumerous(appID)
            .then(function (oldVal) {
                updateNumerousKey(appID, oldVal + value);
                return resolve();
            }).catch(function (error) {
                console.log('Something had an error', error);
                return reject();
            });
    });
};

exports.getRMQWorker = function (rabbitMQ) {
    return new Promise(function (resolve, reject) {
        amqp.connect(rabbitMQ.rabbitMQAuthString()).then(function (conn) {
            process.once('SIGINT', function () {
                conn.close();
            });
            return conn.createChannel().then(function (ch) {
                var ok = ch.assertQueue(rabbitMQ.queue, {
                    durable: true
                });
                ok = ok.then(function () {
                    ch.prefetch(1);
                });

                function doWork(msg) {
                    var body = msg.content.toString();
                    console.log(' [x] Received "%s"', body);
                    resolve({
                        body: body,
                        ch: ch,
                        msg: msg
                    });
                }
                ok = ok.then(function () {
                    ch.consume(rabbitMQ.queue, doWork, {
                        noAck: false
                    });
                    console.log(' [*] Waiting for messages. To exit press CTRL+C');
                });
                return ok;
            });
        }).then(null, console.warn);
    }).catch(function () {
        reject(msg);
    });
};

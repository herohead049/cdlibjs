/*jslint nomen: true */
/*jslint node:true */

var request = require("request");
var Promise = require('bluebird');
var amqp = require('amqplib');
var when = require('when');
var email = require('emailjs');
var serialize = require('node-serialize');
var server = require('../cd_lib/lib/server.js');

var cdlib = require('../cd_lib');

exports.checkLocation = server.checkLocation;
exports.getRedisAddress = server.getRedisAddress;
exports.getRabbitMQAddress = server.getRabbitMQAddress;


exports.sendRMQWorker = function (rabbitMQ, message) {
    "use strict";
    amqp.connect(rabbitMQ.rabbitMQAuthString()).then(function (conn) {
        return when(conn.createChannel().then(function (ch) {
            var q = rabbitMQ.queue,
                ok = ch.assertQueue(q, {'durable': true });

            return ok.then(function () {
                var msg = process.argv.slice(2).join(' ') || message;
      //ch.sendToQueue(q, new Buffer(msg), {deliveryMode: true, expiration: 1000});
                ch.sendToQueue(q, new Buffer(msg), {deliveryMode: true});
      //console.log(" [x] Sent '%s'", msg);
                return ch.close();
            });
        })).ensure(function () { conn.close(); });
    }).then(null, console.warn);
};



// promise - getOldNumerous

var getOldNumerous = function (appKey) {
    "use strict";
    return new Promise(function (resolve, reject) {

        request({
            headers: {'Authorization': "Basic bm1yc19PUlJWdzhqWkRIQVA6"},
            url: 'https://api.numerousapp.com/v1/metrics/' + appKey,
            method: "GET"
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

var updateNumerousKey = function (appKey, value) {
    "use strict";
    return new Promise(function (resolve, reject) {
        request({
            headers: {'Authorization': "Basic bm1yc19PUlJWdzhqWkRIQVA6"},
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
    "use strict";
    return new Promise(function (resolve, reject) {

        var success = "";

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
    "use strict";
    return new Promise(function (resolve, reject) {

        amqp.connect(rabbitMQ.rabbitMQAuthString()).then(function (conn) {
            process.once('SIGINT', function () { conn.close(); });
            return conn.createChannel().then(function (ch) {
                var ok = ch.assertQueue(rabbitMQ.queue, {durable: true});
                ok = ok.then(function () { ch.prefetch(1); });
                function doWork(msg) {
                    var body = msg.content.toString();
                    console.log(" [x] Received '%s'", body);
                    resolve({body: body, ch: ch, msg: msg});
                }
                ok = ok.then(function () {
                    ch.consume(rabbitMQ.queue, doWork, {noAck: false});
                    console.log(" [*] Waiting for messages. To exit press CTRL+C");
                });
                return ok;


            });
        }).then(null, console.warn);
    }).catch(function () {
        reject(msg);
    });

};

var rabbitMQ = {
    server: cdlib.getRabbitMQAddress(),
    username: 'test',
    password: 'test',
    virtualHost: '/test',
    queue: 'hello',
    exchange: 'main.exchange',
    exchangeType: 'topic',
    routingKey: 'info',
    message: 'HelloWorld',
    durable: 'true',
    trunctMessage: function () {
        "use strict";
        if (rabbitMQ.message.length > 100) {
            return "Message to large to display. Sent " + rabbitMQ.message.length;
        } else {
            return rabbitMQ.message;
        }
    },
    rabbitMQAuthString: function () {
        "use strict";
        return 'amqp://' + this.username + ':' + this.password + '@' + this.server + this.virtualHost;
    },
    publishTopic: function (msg) {
        "use strict";
        if (typeof msg !== 'undefined') {
            this.message = msg;
        }
        amqp.connect(rabbitMQ.rabbitMQAuthString()).then(function (conn) {
            return when(conn.createChannel().then(function (ch) {
                var ok = ch.assertExchange(rabbitMQ.exchange, rabbitMQ.exchangeType, {durable: rabbitMQ.durable});
                return ok.then(function () {
                    ch.publish(rabbitMQ.exchange, rabbitMQ.routingKey, new Buffer(rabbitMQ.message));
                    console.log(" [x] Sent %s:'%s'", rabbitMQ.routingKey, rabbitMQ.trunctMessage());
                    return ch.close();
                });
            })).ensure(function () { conn.close(); });
        }).then(null, console.log);
    }
};

var msgEmail = {
    smtpServer: 'smtp.mt.com',
    to: 'craig.david@mt.com',
    from: 'craig.david@mt.com',
    subject: 'test subject',
    body: 'body text',
    htmlData: '<b>H</b>tml body',
    getConfig: function () {
        "use strict";
        return this;
    },
    sendText: function (body) {
        //var Promise =  require('bluebird');
        "use strict";
        if (typeof body !== 'undefined') {
            this.body = body;
        }
        //var ret;
        var email = require('emailjs'),
            server = email.server.connect({host: "smtp.mt.com"}),
            message = {
                text: this.body,
                from: this.from,
                to: this.to,
                cc: "",
                subject: this.subject
            };
        return new Promise(function (resolve, reject) {
            server.send(message, function (err, message) {
            //console.log(err || message);
            //console.log(err);

                if (err !== null) {
                    console.log('sendHtml: Error');
                    reject('sendHtml: Error');
                } else {
                    console.log('sendHtml: No Error');
                    resolve('sendHtml: No Error');
                }
            });
        });
    },
    sendHtml: function (html) {
        "use strict";
        if (typeof html !== 'undefined') {
            this.htmlData = html;
        }
        var email = require('emailjs'),
            server = email.server.connect({host: this.smtpServer}),
            message = {
                text: this.body,
                from: this.from,
                to: this.to,
                cc: "",
                subject: this.subject,
                attachment:
                    [
                        {data: this.htmlData, alternative: true}
                    ]
            };
        return new Promise(function (resolve, reject) {
            server.send(message, function (err, message) {
            //console.log(err || message);
            //console.log(err);

                if (err !== null) {
                    console.log('sendHtml: Error');
                    reject('sendHtml: Error');
                } else {
                    console.log('sendHtml: No Error');
                    resolve('sendHtml: No Error');
                }
            });
        });
    },
    toString: function () {
        "use strict";
        return serialize.serialize(this);
    },
    sendToRabbit: function () {
        //var t = serialize.serialize(this);
        "use strict";
        cdlib.rabbitMQ.routingKey = "email";
        cdlib.rabbitMQ.publishTopic(this.toString());
    },
    type: "html",
    sendEmail: function () {
        "use strict";
        this.sendText()
            .then(function () {
                console.log("sendEmail true");
            }).catch(function (err) {
                console.log("sendEmail false");
            //return false;
            });
    }
};

exports.rabbitMQ = rabbitMQ;
exports.msgEmail = msgEmail;

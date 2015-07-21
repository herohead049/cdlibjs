/*jslint nomen: true */
/*jslint node:true */
/*jslint vars: true */
/*jslint es5: true */

/*eslint-env node */
/*eslint quotes: [2, "single"], curly: 2*/

'use strict';

var amqp = require('amqplib');
var when = require('when');

var rabbitMQ = {
    server: '',
    username: 'test',
    password: 'test',
    virtualHost: '/test',
    queue: 'hello',
    exchange: 'main.exchange',
    exchangeType: 'topic',
    routingKey: 'info',
    message: 'HelloWorld',
    durable: 'true',
    trunctMessage: function (msg) {

        if (msg.length > 100) {
            return 'Message to large to display. Sent ' + msg.length;
        } else {
            return msg;
        }
    },
    rabbitMQAuthString: function () {
        return 'amqp://' + this.username + ':' + this.password + '@' + this.server + this.virtualHost;
    },
    publishTopic: function (msg) {
        if (typeof msg === 'undefined') {
            //msg = this.message;
        }
        amqp.connect(rabbitMQ.rabbitMQAuthString()).then(function (conn) {
            return when(conn.createChannel().then(function (ch) {
                var ok = ch.assertExchange(rabbitMQ.exchange, rabbitMQ.exchangeType, {
                    durable: rabbitMQ.durable
                });
                return ok.then(function () {
                    ch.publish(rabbitMQ.exchange, rabbitMQ.routingKey, new Buffer(msg));
                    console.log(' [x] Sent %s:"%s"', rabbitMQ.routingKey, rabbitMQ.trunctMessage(msg), JSON.parse(msg).subject);
                    return ch.close();
                });
            })).ensure(function () {
                conn.close();
            });
        }).then(null, console.log);
    }
};

var sendEMailToRabbit = function (msgEmail) {
    rabbitMQ.routingKey = 'email';
    console.log('in sendEMailtoRabbit', msgEmail.subject);
    rabbitMQ.publishTopic(JSON.stringify(msgEmail));
};

exports.sendEMailToRabbit = sendEMailToRabbit;
exports.rabbitMQ = rabbitMQ;

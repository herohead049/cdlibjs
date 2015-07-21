/*eslint-env node */
/*eslint quotes: [2, "single"], curly: 2*/

'use strict';

var cdlib = require('../index.js');
var _ = require('lodash');

//console.log(cdlib.getRabbitMQAddress());

var msgEmail = cdlib.msgEmail;


msgEmail.to = 'craig.david@mt.com';
msgEmail.from = 'craig.david@mt.com';
msgEmail.smtpServer = 'smtp.mt.com';
msgEmail.subject = 'test subject 1';
msgEmail.htmlData = '<b>B</b>oldy';


//console.log(msgEmail);

//cdlib.sendEmailHtml(msgEmail);
//msgEmail.subject = "subject 2";
//cdlib.sendEmailHtml(msgEmail);

console.log(cdlib.getRabbitMQAddress());

//var getRabbitMQAddress



cdlib.rabbitMQ.server = cdlib.getRabbitMQAddress();

//var a = _.cloneDeep(msgEmail);
cdlib.sendEMailToRabbit(msgEmail);

msgEmail.subject = 'test subject 2';
cdlib.sendEMailToRabbit(msgEmail);

msgEmail.subject = 'test subject 3';
cdlib.sendEMailToRabbit(msgEmail);
msgEmail.subject = 'test subject 4';
cdlib.sendEMailToRabbit(msgEmail);

msgEmail.subject = 'test subject 5';
cdlib.sendEMailToRabbit(msgEmail);
msgEmail.subject = 'test subject 6';
cdlib.sendEMailToRabbit(msgEmail);

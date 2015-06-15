/*jslint nomen: true */
/*jslint node:true */


function sendEmail (msgEmail) {
    "use strict";
        var email = require('emailjs'),
            server = email.server.connect({host: msgEmail.smtpServer}),
            message = {
                text: msgEmail.body,
                from: msgEmail.from,
                to: msgEmail.to,
                cc: "",
                subject: msgEmail.subject
            };
          server.send(message, function (err, message) {
            //console.log(err || message);
            //console.log(err);

                if (err !== null) {
                    console.log('sendHtml: Error', err);
       //             reject('sendHtml: Error');
                } else {
                    console.log('sendHtml: No Error');
        //            resolve('sendHtml: No Error');
                }
            });
        
}



function sendEmailHtml (msgEmail) {
        //console.log("In sendEmailHtml", msgEmail);
        var email = require('emailjs'),
            server = email.server.connect({host: msgEmail.smtpServer}),
            message = {
                text: msgEmail.body,
                from: msgEmail.from,
                to: msgEmail.to,
                cc: "",
                subject: msgEmail.subject,
                attachment:
                    [
                        {data: msgEmail.htmlData, alternative: true}
                    ]
            };
        return new Promise(function (resolve, reject) {
            server.send(message, function (err, message) {
            //console.log(err || message);
            //console.log(err);

                if (err !== null) {
                    //console.log('sendHtml: Error');
                    reject('sendHtml: Error');
                } else {
                    //console.log('sendHtml: No Error');
                    resolve('sendHtml: No Error');
                }
            });
        });
}



var msgEmail = {
    smtpServer: '',
    to: '',
    from: '',
    subject: 'test subject',
    body: 'body text',
    htmlData: '<b>H</b>tml body',
    type: "html"
};

    
exports.msgEmail = msgEmail;
exports.sendEmailHtml = sendEmailHtml;
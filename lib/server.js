/*jslint nomen: true */
/*jslint node:true */

var ip = require('ip');

// get the current IP and determind if this is running at home or at work.
// returns 'home' or 'work'

var checkLocation = function () {
    'use strict';
    var ipAddress = ip.address(),
        arr = ipAddress.split('.'),
        site = "",
        compare = arr[0];
    switch (compare) {
    case '192':
        site = 'home';
        break;
    default:
        site = 'work';
        break;
    }
    return site;
};

var getRabbitMQAddress = function () {
    'use strict';
    var site = "";
    switch (checkLocation()) {
    case 'home':
        site = '192.168.50.91';
        break;
    default:
        site = 'us01s-netops02.am.mt.mtnet';
        break;
    }
    return site;
};

// return redis Address

var getRedisAddress = function () {
    'use strict';
    var site = "";
    switch (checkLocation()) {
    case 'home':
        site = '192.168.50.113';
        break;
    default:
        site = 'backupreport.eu.mt.mtnet';
        break;
    }
    return site;
};

exports.checkLocation = checkLocation;
exports.getRedisAddress = getRedisAddress;
exports.getRabbitMQAddress = getRabbitMQAddress;

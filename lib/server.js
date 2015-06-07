var ip = require('ip');


exports.checkLocation = function () {
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
}


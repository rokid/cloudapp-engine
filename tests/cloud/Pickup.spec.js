'use strict';

const test = require('ava');
const CloudAppEngine = require('../../').CloudAppEngine;
const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';

test.cb('pickup', (t) => {
  t.plan(2);
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('pickup', () => {
    t.pass();
  });
  client.on('exit', (id) => {
    t.is(appId, id);
    t.end();
  });
  client.eval({
    'appId': appId,
    'response': {
      'action': {
        'version': '2.0.0',
        'type': 'NORMAL',
        'form': 'cut',
        'shouldEndSession': true,
        'directives': [{
          'type':'pickup',
          'enable': true,
          'durationInMilliseconds': 2000,
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});

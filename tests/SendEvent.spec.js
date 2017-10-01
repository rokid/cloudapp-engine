'use strict';

const test = require('ava');
const SendEvent = require('../lib/SendEvent');
const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';

test.cb('SendEvent.constructor', (t) => {
  const sendEvent = new SendEvent(process.env.EVENT_REQUEST_HOST, {
    key: process.env.ROKID_KEY,
    secret: process.env.ROKID_SECRET,
    device_id: process.env.ROKID_DEVICE_ID,
    device_type_id: process.env.ROKID_DEVICE_TYPE_ID
  });
  sendEvent.send(appId, 'Voice.STARTED', {}, (err, data) => {
    t.is(err, null);
    t.is(data.appId, appId);
    t.deepEqual(data.response.action, {
      directives: [],
      form: 'scene',
      shouldEndSession: false,
      type: 'NORMAL',
      version: '2.0.0'
    });
    t.end();
  });
});

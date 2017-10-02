'use strict';

const test = require('ava');
const SendEvent = require('../lib/SendEvent');
const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';

test('SendEvent throws if no config', (t) => {
  const err = t.throws(() => {
    new SendEvent(process.env.EVENT_REQUEST_HOST, {
      // Empty object
    });
  }, TypeError);
  t.is(err.message, '"key" is required for SendEvent');
});

test('SendEvent throws if no config.secret', (t) => {
  const err = t.throws(() => {
    new SendEvent(process.env.EVENT_REQUEST_HOST, {
      key: process.env.ROKID_KEY
    });
  }, TypeError);
  t.is(err.message, '"secret" is required for SendEvent');
});

test('SendEvent throws if no config.device_type_id', (t) => {
  const err = t.throws(() => {
    new SendEvent(process.env.EVENT_REQUEST_HOST, {
      key: process.env.ROKID_KEY,
      secret: process.env.ROKID_SECRET,
    });
  }, TypeError);
  t.is(err.message, '"device_type_id" is required for SendEvent');
});

test.cb('SendEvent constructor', (t) => {
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

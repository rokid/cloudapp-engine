'use strict';

const test = require('ava');
const CloudAppEngine = require('../../').CloudAppEngine;
const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';

test.cb('exit app', (t) => {
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
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
        'type': 'EXIT',
        'form': 'cut',
        'shouldEndSession': true,
        'directives': []
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});

test.cb('unhandled directive', (t) => {
  t.plan(2);
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('error', (err) => {
    t.is(err.code, 'UNKNOWN_DIRECTIVE');
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
          'type': 'unhandle_type'
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});

test('setVoice throws error if no app is running', (t) => {
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  t.throws(() => {
    client.setVoice();
  }, Error);
  t.pass();
});

test.cb('setVoice throws error if voice is null', (t) => {
  let thrown = false;
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('voice.play', function(voice, done) {
    t.throws(() => this.setVoice(), TypeError);
    thrown = true;
    done();
  });
  client.on('exit', function() {
    t.is(thrown, true);
    t.end();
  });
  client.on('error', function(err) {
    t.is(err.message, 'voice instance is required when "voice.play"');
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
          'type': 'voice',
          'action': 'PLAY',
          'disableEvent': false,
          'item': {
            'tts': 'tts',
          }
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});

test('setMedia throws error if no app is running', (t) => {
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  t.throws(() => {
    client.setMedia();
  }, Error);
  t.pass();
});

test.cb('setMedia throws error if media is null', (t) => {
  let thrown = false;
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('media.play', function(media, done) {
    t.throws(() => this.setMedia(), TypeError);
    thrown = true;
    done();
  });
  client.on('exit', function() {
    t.is(thrown, true);
    t.end();
  });
  client.on('error', function(err) {
    t.is(err.message, 'media instance is required when "media.play"');
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
          'type': 'media',
          'action': 'PLAY',
          'disableEvent': false,
          'item': {
            'url': 'foobar',
          }
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});

test('only 1 listener', (t) => {
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('media.play', function() {
    t.fail();
  });
  client.on('media.play', function() {
    t.fail();
  });
  const err = t.throws(() => {
    client.eval({
      'appId': appId,
      'response': {     
        'action': {
          'version': '2.0.0',
          'type': 'NORMAL',
          'form': 'cut',
          'shouldEndSession': true,
          'directives': [{
            'type': 'media',
            'action': 'PLAY',
            'disableEvent': false,
            'item': {
              'url': 'foobar',
            }
          }]
        }
      },
      'startWithActiveWord': false,
      'version': '2.0.0'
    });
  }, Error);
  t.is(err.message, 'use 1 listener for the "media.play" event');
});




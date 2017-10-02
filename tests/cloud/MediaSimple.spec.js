'use strict';

const test = require('ava');
const CloudAppEngine = require('../../').CloudAppEngine;
const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';

test.cb('play simple media', (t) => {
  t.plan(11);
  const itemId = 'foobarId';
  const url = 'https://foobar.test';
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('media.play', function(media, done) {
    this.setMedia('foobar');
    t.is(media.itemId, itemId);
    t.is(media.url, url);
    done();
  });
  client.on('media.stop', function(media) {
    t.is(media, 'foobar');
  });
  client.on('exit', function() {
    t.end();
  });
  client.on('before event', function(context) {
    if (context.event === 'Media.STARTED') {
      t.deepEqual(context.data.media, {
        itemId, url
      });
    } else if (context.event === 'Media.FINISHED') {
      t.deepEqual(context.data.media, {
        itemId, url
      });
    }
  });
  client.on('after event', function(context) {
    if (context.event === 'Media.FINISHED') {
      let directives = context.data.response.action.directives;
      t.is(directives.length, 1);
      t.is(directives[0].action, 'PLAY');
      t.is(directives[0].type, 'media');
      t.is(directives[0].item.offsetInMilliseconds, 0);
      t.is(directives[0].item.token, '');
      t.is(directives[0].item.type, 'AUDIO');
    }
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
          'disableEvent': true,
          'item': {
            'itemId': itemId,
            'url': url,
          }
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});

test.cb('throws if no data is pass by media.play', (t) => {
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('media.play', function(media, done) {
    done();
  });
  client.on('error', function(err) {
    t.is(err.message, 'media instance is required when "media.play"');
  });
  client.on('exit', function() {
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
          'type': 'media',
          'action': 'PLAY',
          'disableEvent': true,
          'item': {}
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});


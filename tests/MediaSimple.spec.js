'use strict';

const test = require('ava');
const CloudAppEngine = require('../').CloudAppEngine;

test.cb('play simple media', (t) => {
  t.plan(11);
  const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';
  const itemId = 'foobarId';
  const url = 'https://foobar.test';
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('media.play', (media, done) => {
    t.is(media.itemId, itemId);
    t.is(media.url, url);
    done(null, 'foobar');
  });
  client.on('media.stop', (voice) => {
    t.is(voice, 'foobar');
  });
  client.on('exit', () => {
    t.end();
  });
  client.on('before event', (context) => {
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
  client.on('after event', (context) => {
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

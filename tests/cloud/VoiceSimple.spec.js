'use strict';

const test = require('ava');
const CloudAppEngine = require('../../').CloudAppEngine;
const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';
const tts = '晚上好，若琪为您播放晚间新闻摘要，首先我们来看看社会新闻!';

test.cb('play simple voice', (t) => {
  t.plan(5);
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('voice.play', function(voice, done) {
    this.setVoice('foobar');
    t.is(voice.tts, tts);
    done(null);
  });
  client.on('voice.stop', function(voice) {
    t.is(voice, 'foobar');
  });
  client.on('exit', function() {
    t.end();
  });
  client.on('before event', function(context) {
    if (context.event === 'Voice.STARTED') {
      t.is(context.data.voice.tts, tts);
    } else if (context.event === 'Voice.FINISHED') {
      t.is(context.data.voice.tts, tts);
    }
  });
  client.on('after event', function(context) {
    if (context.event === 'Voice.FINISHED') {
      t.is(context.data.response.action.directives.length, 1);
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
          'type': 'voice',
          'action': 'PLAY',
          'disableEvent': true,
          'item': {
            'tts': tts
          }
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});

test.cb('throws if no data is pass by voice.play', (t) => {
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('voice.play', (voice, done) => {
    done();
  });
  client.on('error', (err) => {
    t.is(err.message, 'voice instance is required when "voice.play"');
  });
  client.on('exit', () => {
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
          'type': 'voice',
          'action': 'PLAY',
          'disableEvent': true,
          'item': {
            'tts': tts
          }
        }]
      }
    },
    'startWithActiveWord': false,
    'version': '2.0.0'
  });
});

// test.cb('pause voice', (t) => {
//   const client = new CloudAppEngine({
//     host            : process.env.EVENT_REQUEST_HOST,
//     key             : process.env.ROKID_KEY,
//     secret          : process.env.ROKID_SECRET,
//     device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
//     device_id       : process.env.ROKID_DEVICE_ID,
//   });
//   client.on('voice.play', (voice, done) => {
//     setTimeout(() => done(null, 'voice'), 500);
//   });
//   client.on('voice.stop', (voice) => {
//     console.log('stoped', voice);
//   });
//   client.on('exit', () => {
//     t.end();
//   });
//   client.eval({
//     'appId': appId,
//     'response': {     
//       'action': {
//         'version': '2.0.0',
//         'type': 'NORMAL',
//         'form': 'cut',
//         'shouldEndSession': true,
//         'directives': [{
//           'type': 'voice',
//           'action': 'PLAY',
//           'disableEvent': true,
//           'item': {
//             'tts': tts
//           }
//         }]
//       }
//     },
//     'startWithActiveWord': false,
//     'version': '2.0.0'
//   });
//   setTimeout(() => {
//     client.eval({
//       'appId': appId,
//       'response': {     
//         'action': {
//           'version': '2.0.0',
//           'type': 'NORMAL',
//           'form': 'cut',
//           'shouldEndSession': true,
//           'directives': [{
//             'type': 'voice',
//             'action': 'PAUSE',
//           }]
//         }
//       },
//       'startWithActiveWord': false,
//       'version': '2.0.0'
//     });
//   }, 1000);
// });


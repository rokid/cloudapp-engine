const test = require('ava');
const CloudAppEngine = require('../../').CloudAppEngine;
const appId = 'R4AB842832E84BBD8B2DD6537DAFF790';
const tts = '晚上好，若琪为您播放晚间新闻摘要，首先我们来看看社会新闻!';

test.cb('play session voice', (t) => {
  t.plan(3);
  const client = new CloudAppEngine({
    host            : process.env.EVENT_REQUEST_HOST,
    key             : process.env.ROKID_KEY,
    secret          : process.env.ROKID_SECRET,
    device_type_id  : process.env.ROKID_DEVICE_TYPE_ID,
    device_id       : process.env.ROKID_DEVICE_ID,
  });
  client.on('voice.play', function(voice, done) {
    this.setVoice('foobar');
    t.pass();
    done(null);
  });
  client.on('voice.stop', function(voice) {
    t.is(voice, 'foobar');
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
        'form': 'scene',
        'shouldEndSession': false,
        'directives': [{
          'type': 'voice',
          'action': 'PLAY',
          'disableEvent': false,
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
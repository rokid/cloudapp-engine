'use strict';

const CloudAppEngine = require('./').CloudAppEngine;
const client = new CloudAppEngine({
  host            : 'apigwrest-dev.open.rokid.com',
  key             : '**************',
  device_type_id  : '**************',
  device_id       : '**************',
  secret          : '**************',
});

client.on('exit', () => {
  console.log('should exit');
});

client.on('voice.play', (voice, finish) => {
  console.log('tts say', voice);
  setTimeout(() => {
    finish(null, {});
  }, 2000);
});
client.on('voice.stop', (tts) => {
  console.log('should stop');
});

client.on('pickup', (duration) => {
  console.log('should pickup', duration);
});

client.on('error', (err) => {
  // on error
  console.log(err);
});

client.eval({  
  'appId': 'R4AB842832E84BBD8B2DD6537DAFF790',
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
          'tts': '晚上好，若琪为您播放晚间新闻摘要，首先我们来看看社会新闻!'
        }
      }, {
        'type':'confirm',
        'confirmIntent': 'nlp intent to confirm',
        'confirmSlot': 'nlp slot to confirm',
        'optionWords': ['word1', 'word2']
      }]
    }
  },
  'startWithActiveWord': false,
  'version': '2.0.0'
});

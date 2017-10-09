'use strict';

const debug = require('debug')('rokid:CAE:cloudapp');

/**
 * @class CloudApp
 */
class CloudApp {
  /**
   * @method constructor
   * @param {Object} data
   * @param {Engine} engine
   */
  constructor(data, engine) {
    this._data = data;
    this._engine = engine;
    this._appid = data.appId;
    this._voice = false;
    this._media = false;
    this._form = this.action.form || 'cut';
    this._pickup = false;
    this._pickupDuration = 6000;
    this._exitAfterIdle = false;
    this._tasks = [];
    this.parse(this.action);
  }
  /**
   * @getter valid
   */
  get valid() {
    return this._valid;
  }
  /**
   * @getter action
   */
  get action() {
    return this._data.response.action;
  }
  /**
   * @getter appid
   */
  get appid() {
    return this._appid;
  }
  /**
   * @getter voice
   */
  get voice() {
    return this._voice;
  }
  /**
   * @setter voice
   */
  set voice(val) {
    if (this.voice !== null && val === null) {
      this._engine._tryEmit(this.appid, 'voice.stop', this.voice);
      return;
    }
    this._voice = val;
  }
  /**
   * @getter media
   */
  get media() {
    return this._media;
  }
  /**
   * @setter media
   */
  set media(val) {
    if (this.media !== null && val === null) {
      this._engine._tryEmit(this.appid, 'media.stop', this.media);
      return;
    }
    this._media = val;
  }
  /**
   * @method parse
   * @param {Object} action
   */
  parse(action) {
    if (action.type === 'EXIT') {
      this._valid = true;
      debug('enter EXIT and return');
      return;
    }

    if (action.shouldEndSession)
      this._exitAfterIdle = true;

    let directives = action.directives;
    for (let idx in directives) {
      let item = directives[idx];
      switch (item.type) {
      case 'confirm'  : this.confirm(item); break;
      case 'pickup'   : this.pickup(item); break;
      case 'voice'    : this.handleVoice(item); break;
      case 'media'    : this.handleMedia(item); break;
      default         : this.unknownDirective(item); break;
      }
    }
    this._valid = true;
    debug(`parse ${this.appid} is done`);
  }
  /**
   * @method sleep
   * @param {Number} ms
   */
  sleep(ms=0) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  /**
   * @method exit
   */
  exit() {
    this.voice = null;
    this.media = null;
    this._engine._tryExitById(this.appid);
  }
  /**
   * @method execute
   */
  execute() {
    let unpack = (fn) => fn();
    let exitAfterIdle = this._exitAfterIdle;
    let doExec = Promise.all(this._tasks.map(unpack));
    this._tasks = [];

    return doExec.then(() => {
      if (!exitAfterIdle && this._tasks.length > 0) {
        debug('checked tasks to execute again');
        return this.execute();
      } else {
        return this.afterExecute();
      }
    });
  }
  /**
   * @method afterExecute
   */
  afterExecute() {
    return this.sleep(0).then(() => {
      if (this._pickup) {
        this._engine._tryPickup(this._pickupDuration);
        return this.sleep(this._pickupDuration);
      }
    }).then(() => {
      this.exit();
    }).catch((err) => {
      console.error(err && err.stack);
    });
  }
  /**
   * @method confirm
   * @param {Object} item
   */
  confirm(item) {
    if (item && item.confirmIntent && item.confirmSlot) {
      this._pickup = true;
      debug('try to confirm');
    }
  }
  /**
   * @method pickup
   * @param {Object} item
   */
  pickup(item) {
    if (item) {
      this._pickup = item.enabled || item.enable;
      this._pickupDuration = item.durationInMilliseconds || 6000;
      debug('try to pickup');
    }
  }
  /**
   * @method handleVoice
   * @param {Object} item
   */
  handleVoice(item) {
    let task;
    switch (item.action) {
    case 'PAUSE':
    case 'STOP':
      this._tasks.push(() => {
        return Promise.all([
          this.sendEvent('Voice.FAILD', item.item),
          this._engine._tryEmit(this.appid, 'voice.stop', this.voice),
        ]);
      });
      break;
    default:
      if (item.item && item.item.tts) {
        this._tasks.push(() => {
          return Promise.all([
            this.sendEvent('Voice.STARTED', item.item),
            this._engine._tryEmit(this.appid, 'voice.play', item.item),
          ]);
        });
      } else {
        debug('skip voice because item is invalid', item.item);
      }
      break;
    }
  }
  /**
   * @method handleMedia
   * @param {Object} item
   */
  handleMedia(item) {
    let task;
    switch (item.action) {
    case 'PLAY':
      this._tasks.push(() => {
        return Promise.all([
          this.sendEvent('Media.STARTED', item.item),
          this._engine._tryEmit(this.appid, 'media.play', item.item),
        ]);
      });
      break;
    case 'STOP':
      this._tasks.push(() => {
        return Promise.all([
          this.sendEvent('Media.FINISHED', item.item),
          this._engine._tryEmit(this.appid, 'media.stop', this.media),
        ]);
      });
      break;
    case 'PAUSE':
      this._tasks.push(() => {
        return Promise.all([
          this.sendEvent('Media.PAUSED', item.item),
          this._engine._tryEmit(this.appid, 'media.pause', this.media),
        ]);
      });
      break;
    case 'RESUME':
      this._tasks.push(() => {
        return Promise.all([
          this.sendEvent('Media.STARTED', item.item),
          this._engine._tryEmit(this.appid, 'media.resume', this.media),
        ]);
      });
      break;
    default:
      break;
    }
  }
  /**
   * @method unknownDirective
   * @param {Object} item
   */
  unknownDirective(item) {
    const err = new Error(`Unknown directive "${item.type}" from CloudApp servcer-side`);
    err.code = 'UNKNOWN_DIRECTIVE';
    this._engine._tryEmit(this.appid, 'error', err);
  }
  /**
   * @method addEventTask
   * @param {String} event
   * @param {Object} item
   * @param {Object} item
   */
  addEventTask(event, item, data) {
    if (event === 'voice.play') {
      return this.sendEvent('Voice.FINISHED', item);
    } else if (event === 'media.play') {
      return this.sendEvent('Media.FINISHED', item);
    }
    return this.sleep(0);
  }
  /**
   * @method sendEvent
   * @param {String} event
   * @param {Object} data
   */
  sendEvent(event, data) {
    if (event.search('Voice') !== -1) {
      data = { voice: data };
    } else if (event.search('Media') !== -1) {
      data = { media: data };
    }
    return new Promise((resolve, reject) => {
      this._engine._tryEmit(this._appid, 'before event', { event, data });
      this._engine._sendEvent.send(this._appid, event, data, (err, data) => {
        if (err)
          return reject(err);
        this._engine._tryEmit(this._appid, 'after event', { event, data });
        this.parse(data.response.action);
        resolve();
      });
    });
  }
}

module.exports = CloudApp;

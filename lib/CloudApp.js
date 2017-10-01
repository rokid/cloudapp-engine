'use strict';

/**
 * @class CloudApp
 */
class CloudApp {
  /**
   * @method constructor
   */
  constructor(data, engine) {
    this._data = data;
    this._engine = engine;
    this._appid = data.appId;
    this._voice = null;
    this._media = null;
    this._form = this.action.form || 'cut';
    this._pickup = false;
    this._pickupDuration = 6000;
    this._exitAfterIdle = false;
    this._tasks = [];
    this.parse(this.action);
    this.execute();
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
    if (val === null) {
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
    if (val === null) {
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
    if (action.type === 'EXIT')
      this.exit();

    if (action.shouldEndSession)
      return;

    let directives = action.directives;
    for (let idx in directives) {
      let item = directives[idx];
      switch (item.type) {
      case 'confirm'  : this.confirm(item); break;
      case 'pickup'   : this.pickup(item); break;
      case 'voice'    : this.handleVoice(item); break;
      case 'media'    : this.handleMedia(item); break;
      default         : break;
      }
    }
    this._valid = true;
  }
  /**
   * @method sleep
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
    let doExec = Promise.all(this._tasks);
    this._tasks = [];

    return doExec.then(() => {
      console.log('task length:', this._tasks.length);
      if (this._tasks.length > 0) {
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
   */
  confirm(item) {
    if (item && item.confirmIntent && item.confirmSlot) {
      this._pickup = true;
    }
  }
  /**
   * @method pickup
   */
  pickup(item) {
    if (item) {
      this._pickup = item.enabled || item.enable;
      this._pickupDuration = item.durationInMilliseconds || 6000;
    }
  }
  /**
   * @method handleVoice
   */
  handleVoice(item) {
    let task;
    switch (item.action) {
    case 'PAUSE':
    case 'STOP':
      task = Promise.all([
        this.sendEvent('Voice.FAILD', item.item),
        this._engine._tryEmit(this.appid, 'voice.stop', this.voice),
      ]);
      break;
    default:
      if (item.item && item.item.tts) {
        task = Promise.all([
          this.sendEvent('Voice.STARTED', item.item),
          this._engine._tryEmit(this.appid, 'voice.play', item.item),
        ]);
      }
      break;
    }
    if (task)
      this._tasks.push(task);
  }
  /**
   * @method handleMedia
   */
  handleMedia(item) {
    let task;
    switch (item.action) {
    case 'PLAY':
      task = this._engine._tryEmit(this.appid, 'media.play', item.item); break;
    case 'STOP':
      task = this._engine._tryEmit(this.appid, 'media.stop', this.media); break;
    case 'PAUSE':
      task = this._engine._tryEmit(this.appid, 'media.pause', this.media); break;
    case 'RESUME':
      task = this._engine._tryEmit(this.appid, 'media.resume', this.media); break;
    default:
      break;
    }
    if (task)
      this._tasks.push(task);
  }
  /**
   * @method addEventTask
   */
  addEventTask(event, item, data) {
    if (event === 'voice.play') {
      if (!data)
        throw new Error('voice instance is required when "voice.play"');
      this.voice = data;
      return this.sendEvent('Voice.FINISHED', item);
    } else if (event === 'media.play') {
      if (!data)
        throw new Error('media instance is required when "media.play"');
      this.media = data;
      return this.sendEvent('Media.FINISHED', item);
    }
    // this._tasks.push(data);
    return this.sleep(0);
  }
  /**
   * @method sendEvent
   */
  sendEvent(event, data) {
    if (event.search('Voice') !== -1) {
      data = { voice: data };
    } else if (event.search('Media') !== -1) {
      data = { media: data };
    }
    return new Promise((resolve, reject) => {
      this._engine._sendEvent.send(this._appid, event, data, (err, data) => {
        if (err) 
          return reject(err);
        this.parse(data.response.action);
        resolve();
      });
    });
  }
}

module.exports = CloudApp;

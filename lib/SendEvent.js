'use strict';

const path = require('path');
const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');
const protobuf = require('protobufjs');

const SendEventSrc = path.join(__dirname, './SendEvent.proto');
const SendEventProto = protobuf.loadSync(SendEventSrc);
const SendEventRequest = SendEventProto.lookupType('SendEventRequest');
const SendEventResponse = SendEventProto.lookupType('SendEventResponse');

/**
 * @class SendEvent
 */
class SendEvent {
  /**
   * @method constructor
   * @param {String} host
   * @param {Object} config
   * @param {String} config.key
   * @param {String} config.device_type_id
   * @param {String} config.device_id
   * @param {String} config.secret
   * @param {String} config.api_version
   */
  constructor(host, config) {
    this._pathname = '/v1/skill/dispatch/sendEvent'
    this._host = host || 'apigwrest.open.rokid.com';
    this._config = {
      key: config.key,
      device_type_id: config.device_type_id,
      device_id: config.device_id || 'cloudapp-engine_v1',
      secret: config.secret,
      service: 'rest',
      version: config.api_version || '1',
    };
    if (!this._config.key)
      throw new TypeError('"key" is required for SendEvent');
    if (!this._config.secret)
      throw new TypeError('"secret" is required for SendEvent');
    if (!this._config.device_type_id)
      throw new TypeError('"device_type_id" is required for SendEvent');
  }
  /**
   * @getter HTTP_OPTIONS
   */
  get HTTP_OPTIONS() {
    return {
      method: 'POST',
      host: this._host,
      path: this._pathname,
      headers: {
        Authorization: this.HTTP_AUTHORIZATION,
      }
    };
  }
  /**
   * @getter HTTP_AUTHORIZATION
   */
  get HTTP_AUTHORIZATION() {
    const data = Object.assign({}, this._config, {
      time: Math.floor(Date.now() / 1000),
    });
    return [
      `version=${data.version}`,
      `time=${data.time}`,
      `sign=${this.sign(data)}`,
      `key=${data.key}`,
      `device_type_id=${data.device_type_id}`,
      `device_id=${data.device_id}`,
      `service=${data.service}`,
    ].join(';');
  }
  /**
   * @method sign
   * @param {String} data - the string to sign
   */
  sign(data) {
    return crypto.createHash('md5')
      .update(querystring.stringify(data))
      .digest('hex')
      .toUpperCase();
  }
  /**
   * @method encodeRequest
   * @param {String} appid - the appid
   * @param {String} event - the event name
   * @param {Object} extra - the extra to encode
   * @return {Buffer} encoded buffer.
   */
  encodeRequest(appid, event, extra) {
    const pbdata = SendEventRequest.create({
      appId: appid,
      event,
      extra: JSON.stringify(extra),
    });
    return SendEventRequest.encode(pbdata).finish();
  }
  /**
   * @method send
   * @param {String} appid - the appid
   * @param {String} event - the event name
   * @param {Object} options - the options to send
   * @param {Function} callback
   */
  send(appid, event, options, callback) {
    if (typeof callback !== 'function')
      throw new Error('callback must be a function');
    const data = this.encodeRequest(appid, event, options);
    const req = https.request(this.HTTP_OPTIONS, (res) => {
      var list = [];
      res.on('data', (chunk) => list.push(chunk));
      res.on('end', () => {
        const databuf = Buffer.concat(list);
        if (res.statusCode !== 200) {
          const err = new Error(`failed upload ${event} with ${databuf.toString('utf8')}`);
          callback(err);
        } else {
          const msg = SendEventResponse.decode(databuf);
          // console.log(`got ${event} successfully response`, msg.response);
          callback(null, JSON.parse(msg.response));
        }
      });
    });
    req.on('error', (err) => {
      console.error(err && err.stack);
    });
    req.write(data);
    req.end();
  }
}

module.exports = SendEvent;

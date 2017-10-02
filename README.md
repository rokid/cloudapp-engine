# CAE: CloudApp Engine

| Dependency | Build | Coverage |
|------------|-------|----------|
|[![Dependency Status][david-image]][david-url]|[![Build Status][travis-image]][travis-url]|[![Coverage][coveralls-image]][coveralls-url]|

[travis-image]: https://img.shields.io/travis/Rokid/cloudapp-engine.svg?style=flat-square
[travis-url]: https://travis-ci.org/Rokid/cloudapp-engine
[david-image]: http://img.shields.io/david/Rokid/cloudapp-engine.svg?style=flat-square
[david-url]: https://david-dm.org/Rokid/cloudapp-engine
[coveralls-image]: https://img.shields.io/codecov/c/github/Rokid/cloudapp-engine.svg?style=flat-square
[coveralls-url]: https://codecov.io/github/Rokid/cloudapp-engine?branch=master

CAP(Cloud App Protocol) 协议客户端引擎，该库使用纯 JavaScript 实现。

### 安装

```shell
$ npm install @rokid/cloudapp-engine --save
```

## 如何开始

CAE 是我们 CloudApp Protocol 的 JavaScript 实现，理论上来说，可以直接使用在任何可以运行 JavaScript 的环境内，包括 Node.js 及浏览器环境。

下面是一个简单的例子：

```js
const CloudAppEngine = require('@rokid/cloudapp-engine').CloudAppEngine;
const client = new CloudAppEngine({
  host: 'apigwrest-dev.open.rokid.com',
  key: 'your device key',
  secret: 'your device secret',
  device_type_id: 'your device type_id',
  device_id: 'your device id',
});

client.on('voice.play', (item, finish) => {
  // 在这里，使用你自己的 TTS 引擎处理 `voice.play` 事件
  // tts.play(item.tts, finish)
});
client.on('voice.stop', (instance) => {
  // 同样的，这里引擎将告诉你，应该停止语音播报
  instance.stop();
});

client.on('media.play', (item, finish) => {
  // 这里与 voice 同理
});
client.on('media.stop', (instance) => {
  // 这里与 voice 同理
});

client.on('exit', (appid) => {
  // 这个事件告诉用户，需要退出某个指定 appid 的应用
});

client.on('error', (err) => {
  // 整个交互过程中，会有不同的错误类型，这里可以判断 err.code 
  // 来作出本地的错误处理
});
```

## API 文档

CloudApp Engine 的编程接口非常简单明了，通过 `eval()` 方法向客户端传入数据，然后通过 `voice.play`、
`voice.stop`、`media.play`、`media.stop` 等事件去控制本地设备端的状态，用户无需介入任何内部状态的管理，
因此，对于用户来说，每个接口都具有幂等性。

### 类 `CloudAppEngine`

创建一个 CloudApp 协议的本地客户端，接受如下参数：

- `config` {Object} 配置文件
  - `config.host` {String} 发送 EventRequest 的服务器域名，默认为：`apigwrest-dev.open.rokid.com`；
  - `config.key` {String} 设备配置项，请在 Rokid 控制台查看；
  - `config.secret` {String} 设备配置项，请在 Rokid 控制台查看；
  - `config.device_type_id` {String} 设备配置项，请在 Rokid 控制台查看；
  - `config.device_id` {String} 设备配置项，请在 Rokid 控制台查看；

### 方法 `.eval(data)`

用于执行一次数据解析，并且该方法会生成下面的事件。

- `data` {Object} 从 CloudApp 服务端传来的数据

### 事件 `voice.play`

表示 TTS 播放的事件。

- `item` {Object} 服务端返回的 TTS 对象；
- `item.itemId` {String} TTS 对象 ID；
- `item.tts` {String} TTS 内容；
- `finish` {Function} 表示 TTS 播放完成或失败；
  - `err` {Error|String} 错误，失败是传入；
  - `instance` {Object} 向`CloudAppEngine`内部传入一个`voice`对象，该对象会在`voice.stop`返回；

### 事件 `voice.stop`

表示 TTS 停止的事件。

- `instance` {Object} 通过 `voice.play` 中的 `finish()` 传入的对象；
- `finish` {Function} 如果 TTS 的停止操作是一个异步调用，需要调用 `finish()` 表示完成；

### 事件 `media.play`

表示媒体（音乐、视频）播放的事件。

- `item` {Object} 服务端返回的媒体对象；
- `item.itemId` {String} 媒体对象 ID；
- `item.url` {String} 媒体播放的 URI；
- `finish` {Function} 表示媒体播放完成或失败；
  - `err` {Error|String} 错误，失败是传入；
  - `instance` {Object} 向`CloudAppEngine`内部传入一个`media`对象，该对象会在其他事件返回；

### 事件 `media.stop`

表示媒体（音乐、视频）停止播放的事件。

- `instance` {Object} 通过 `media.play` 中的 `finish()` 传入的对象；
- `finish` {Function} 同 `voice.stop` 事件;

### 事件 `media.pause`

表示媒体（音乐、视频）暂停播放的事件。

- `instance` {Object} 通过 `media.play` 中的 `finish()` 传入的对象；
- `finish` {Function} 同 `voice.stop` 事件;

### 事件 `media.resume`

表示媒体（音乐、视频）恢复播放的事件。

- `instance` {Object} 通过 `media.play` 中的 `finish()` 传入的对象；
- `finish` {Function} 同 `voice.stop` 事件;

## 测试

为了能够处理设备端各种复杂的用例，我们将协议层抽象为一个平台无关的引擎，在此基础上，我们对其进行大量的在线测试，
从而减轻客户端测试的负担以及稳定性。

```shell
$ npm test
```

## License

Apache License 2.0


// exporting if node, defining as a global function if browser
if (require('./isNode')) __nodeModule__.exports = define_TAPIC();
else window.TAPIC = define_TAPIC();

function define_TAPIC() {

  let TAPIC = {}; // this is the return object
  let state = require('./priv.obj.state');
  let _ws;
  let _refreshRate = 5; // check the Twitch API every [this many] seconds
  let _event = require('./tapic.fns.events')(TAPIC);
  let _getJSON = require('./priv.fn.getJSON')(state);
  let _parseMessage = require('./priv.fn.parseMessage')(state, _event);
  let _pingAPI = require('./priv.fn.pingAPI')(state, _event);
  let _getSubBadgeUrl = require('./priv.fn.getSubBadgeUrl')(state, _getJSON);

  /**
  * Sets the clientid and oauth, then opens a chat connection and starts polling the Twitch API for data. This needs to be done before joining a channel.
  * @param  {string} clientid Your public clientid.
  * @param  {string} oauth Your user's oauth token. See: https://github.com/justintv/Twitch-API/blob/master/authentication.md for instructions on how to do that.
  * @param  {function} callback Calls back the username when TAPIC has successfully connected to Twitch.
  * @function setup
  */
  TAPIC.setup = function (clientid, oauth, callback) {
    if (typeof clientid != 'string' || typeof oauth != 'string') {
      console.error('Invalid parameters. Usage: TAPIC.setup(clientid, oauth[, callback]);');
      return;
    }
    state.clientid = clientid;
    state.oauth = oauth.replace('oauth:', '');

    _getJSON('https://api.twitch.tv/kraken', function (res) {
      if (res.error && res.error === "Bad Request") {
        console.error('Invalid Client ID or Oauth token.');
        return;
      }
      state.username = res.token.user_name;
      _getJSON('https://api.twitch.tv/kraken/users/' + state.username, function (res) {
        state.id = res._id;
        _init(callback);
      });
    });
  };

  function _init(callback) {
    // setting up websockets
    const twitchWS = 'wss://irc-ws.chat.twitch.tv:443';
    if (require('./isNode')) {
      let WS = require('ws');
      _ws = new WS(twitchWS);
    } else {
      _ws = new WebSocket(twitchWS);
    }

    require('./priv.ws')(state, _ws, _parseMessage, callback);
    require('./priv.ps')(state, _event);

    // TAPIC.joinChannel(channel, callback)
    require('./tapic.fn.joinChannel')(TAPIC, state, _ws, _getSubBadgeUrl, _pingAPI, _refreshRate);

    // TAPIC.sendChat(message)
    require('./tapic.fn.sendChat')(TAPIC, state, _ws, _event);

    // TAPIC.sendWhisper(user, message)
    require('./tapic.fn.sendWhisper')(TAPIC, _ws, _event);

    // TAPIC.isFollowing(user, channel, callback)
    require('./tapic.fn.isFollowing')(TAPIC, _getJSON);

    // TAPIC.isSubscribing(user, callback)
    require('./tapic.fn.isSubscribing')(TAPIC, state, _getJSON);

    // TAPIC.get[...]
    require('./tapic.fns.getters')(TAPIC, state);

    // TAPIC.runCommercial(length)
    require('./tapic.fn.runCommercial')(TAPIC, state);

    // TAPIC.setStatusGame(status, game)
    require('./tapic.fn.setStatusGame')(TAPIC, state);
  } // init()

  require('./doc.events');

  return TAPIC;
}

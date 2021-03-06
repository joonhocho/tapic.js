module.exports = function (TAPIC, state, _getJSON) {
  /**
  * Checks if "user" is subscribed to the current channel. This is an asynchronous function and requires a callback. Requires the channel_check_subscription permission and the username and channel must be the same.
  * @param  {string} user     The user name to check.
  * @param  {function} callback The function that's called when the check is complete. Callback is given an object with isSubscribing (boolean) and dateSubscribed (string).
  * @function isSubscribing
  */
  TAPIC.isSubscribing = function (user, callback) {
    if (typeof user != 'string' || typeof callback != 'function') {
      console.error('Invalid parameters. Usage: TAPIC.isSubscribing(user, callback);');
      return;
    }
    // https://api.twitch.tv/kraken/channels/teststate.channel/subscriptions/testuser
    const url = 'https://api.twitch.tv/kraken/channels/' + state.channel + '/subscriptions/' + user;
    _getJSON(
      url,
      function (res) {
        if (res.error) {
          callback({
            isSubscribing: false
          });
        } else {
          callback({
            isSubscribing: true,
            dateSubscribed: (new Date(res.created_at).toLocaleString())
          });
        }
      }
    );
  };

};

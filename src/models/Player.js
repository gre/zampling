Zampling.Player = Backbone.Model.extend({
  defaults: {
    playing: false
  },
  initialize: function() {
    this.ctx = new (window.webkitAudioContext || window.AudioContext)();
    var gain = this.ctx.createGain()
    gain.gain.value = 1

    this.destination = gain
    this.destination.connect(this.ctx.destination)

    this.tracks = new Zampling.Tracks();
    this.sources = [];

    this.triggerPlaying = _.bind(this._triggerPlaying, this);
    this.set("playing", false);
  },
  _triggerPlaying: function () {
    this.trigger("playing", this.ctx.currentTime-this.get("playStartAt"));
  },
  play: function (position, stopAtPosition) {
    if (this.get("playing")) return;
    this.set("playing", true);
    var currentTime = this.ctx.currentTime;
    this.set("playStartAt", currentTime);
    this.tracks.each(function (track) {
      var when = -position;
      track.get("chunks").forEach(function(node) {
        var source = this.ctx.createBufferSource()
        source.buffer = node.chunk.audioBuffer
        source.connect(this.destination)
        var duration = node.chunk.audioBuffer.duration;
        var start = when;
        if (when < stopAtPosition) {
          when += duration;
          if (when > 0) {
            var playoffset = Math.max(0, duration - when);
            var playduration = Math.min(duration, stopAtPosition - when);
            source.start(currentTime + start, playoffset, playduration);
            this.sources.push(source);
          }
        }
      }, this);
    }, this);
    var playendPromise = Q.all(_.map(this.sources, function (s) {
      var d = Q.defer();
      s.onended = d.resolve;
      return d.promise;
    }));
    playendPromise.then(function() {
      console.log("done");
    });
    playendPromise.then(_.bind(this.stop, this));
    setInterval(this.triggerPlaying, 100);
    this.trigger("play", playendPromise);
  },
  stop: function () {
    if (!this.get("playing")) return;
    this.sources.forEach(function(s) { s.stop(0) });
    this.sources = [];
    clearInterval(this.triggerPlaying);
    this.trigger("stop");
  }
});

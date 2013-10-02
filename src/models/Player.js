Zampling.Player = Backbone.Model.extend({
  initialize: function() {
    this.ctx = new (window.webkitAudioContext || window.AudioContext)();
    var gain = this.ctx.createGain()
    gain.gain.value = 1

    this.destination = gain
    this.destination.connect(this.ctx.destination)

    this.tracks = new Zampling.Tracks();
    this.sources = [];
  },
  play: function () {
    this.tracks.each(function (track) {
      var when = 0;
      track.get("chunks").forEach(function(node) {
        var source = this.ctx.createBufferSource()
        source.buffer = node.chunk.audioBuffer
        source.connect(this.destination)
        source.start(this.ctx.currentTime + (when || 0), 0)
        when += node.chunk.audioBuffer.duration
        this.sources.push(source)
      }, this);
    }, this);
  },
  stop: function() {
    this.sources.forEach(function(s) { s.stop(0) });
    this.sources = [];
  }
});

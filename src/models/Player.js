Zampling.Player = Backbone.Model.extend({
  initialize: function() {
    this.ctx = new (window.webkitAudioContext || window.AudioContext)();
    var gain = this.ctx.createGain()
    gain.gain.value = 0.5

    this.destination = gain
    this.destination.connect(this.ctx.destination)
  },
  play: function(buffer) {
    var source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.destination)
    source.start(0, 0)
    this.source = source
  },
  stop: function() {
    this.source.stop(0)
  },
  pause: function() {

  }
});

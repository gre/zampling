Zampling.Player = Backbone.Model.extend({
  initialize: function() {
    this.ctx = new (window.webkitAudioContext || window.AudioContext)();
    var gain = this.ctx.createGain()
    gain.gain.value = 1

    this.destination = gain
    this.destination.connect(this.ctx.destination)

    this.sources = []
  },
  play: function(T) {
    var self = this

    var when = 0
    var chunks = T.attributes.chunks
    // chunks = chunks.reverse()

    chunks.forEach(function(node) {
      var source = self.ctx.createBufferSource()
      source.buffer = node.chunk.audioBuffer
      source.connect(self.destination)
      source.start(self.ctx.currentTime + (when || 0), 0)
      when += node.chunk.audioBuffer.duration
      self.sources.push(source)
    })
  },
  stop: function() {
    this.sources.forEach(function(s) { s.stop(0) })
    this.sources = []
  }
});

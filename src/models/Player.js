Zampling.Player = Backbone.Model.extend({
  initialize: function() {
    this.ctx = new (window.webkitAudioContext || window.AudioContext)();

    var compressor = this.ctx.createDynamicsCompressor();
    compressor.connect(this.ctx.destination)
    this.destination = compressor

    var gain = this.ctx.createGain()
    gain.gain.value = 1
    gain.connect(compressor)

    this.sources = []
  },
  play: function(T) {
    var self = this

    var when = 0
    var chunks = T.attributes.chunks

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

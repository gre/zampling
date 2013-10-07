
Zampling.Track = Backbone.Model.extend({
  defaults: {
    width: 600,
    height: 100,
    zoom: 0.01,
    scrollX: 0
  },

  initialize: function (opts) {
  },

  cut: function (from, to) {
    var cuttedChunkNode = this.get("chunks").slice(from, to);
    this._triggerChunksChange();
    return cuttedChunkNode;
  },

  copy: function (from, to) {
    return this.get("chunks").subset(from, to);
  },

  insert: function (chunkNodes, at) {
    this.get("chunks").insert(chunkNodes, at);
    this._triggerChunksChange();
  },

  append: function (node) {
    this.get("chunks").append(node);
    this._triggerChunksChange();
  },

  toAudioBuffer: function() {
    var node = this.get("chunks").copy().merge();
    return node.chunk.audioBuffer;
  },

  getCursorStartTime: function () {
    return this.get("cursorstartx") / (this.get("zoom") * this.get("sampleRate"));
  },

  getCursorEndTime: function () {
    return this.get("cursorendx") / (this.get("zoom") * this.get("sampleRate"));
  },

  getStat: function (from, to) {
    var min = Infinity, max = -Infinity;
    var currentChunkI = 0;
    var currentChunkNode = this.get("chunks");
    var currentChunkSize = currentChunkNode.chunk.audioBuffer.length;
    var currentSamples = currentChunkNode.chunk.audioBuffer.getChannelData(0); // FIXME only on left channel
    for (var i = from; i < to; ++i) {
      while (currentChunkNode && i > currentChunkI + currentChunkSize) {
        currentChunkI += currentChunkSize;
        currentChunkNode = currentChunkNode.next;
        if (currentChunkNode) {
          currentChunkSize = currentChunkNode.chunk.audioBuffer.length;
          currentSamples = currentChunkNode.chunk.audioBuffer.getChannelData(0);
        }
      }
      if (!currentChunkNode) break;
      var value = currentSamples[i-currentChunkI];
      if (value < min) min = value;
      if (value > max) max = value;
    }
    return {
      min: min,
      max: max
    };
  },

  _triggerChunksChange: function (opts) {
    this.trigger("change:chunks", this, this.get("chunks"), opts||{});
    this.trigger("change", this, opts||{});
  }
});

Zampling.Tracks = Backbone.Collection.extend({
  model: Zampling.Track
});

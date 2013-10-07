
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
    var cuttedChunkNode = this.get("chunks").slice(this.get("ctx"), from, to);
    this._triggerChunksChange();
    return cuttedChunkNode;
  },

  copy: function (from, to) {
    return this.get("chunks").subset(this.get("ctx"), from, to);
  },

  insert: function (chunkNodes, at) {
    this.get("chunks").insert(this.get("ctx"), chunkNodes, at);
    this._triggerChunksChange();
  },

  append: function (node) {
    this.get("chunks").append(node);
    this._triggerChunksChange();
  },

  toAudioBuffer: function() {
    var ctx = this.get("ctx");
    var node = this.get("chunks").clone(ctx).merge(ctx);
    return node.chunk.audioBuffer;
  },

  getCursorStartTime: function () {
    return this.get("cursorstartx") / (this.get("zoom") * this.get("ctx").sampleRate);
  },

  getCursorEndTime: function () {
    return this.get("cursorendx") / (this.get("zoom") * this.get("ctx").sampleRate);
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
}, {
  DEFAULT_SAMPLES_SIZE: 44100,
  createFromAudioBuffer: function (audioBuffer, ctx, samplesSize) {
    if (!audioBuffer || audioBuffer.length === 0) throw "AudioBuffer is empty.";
    // Cutting in multiple chunks of size 'sampleSize'
    if (!samplesSize) samplesSize = Zampling.Track.DEFAULT_SAMPLES_SIZE;
    var head = new Zampling.ChunkNode(new Zampling.Chunk(audioBuffer), null);
    for (var n=head; n.chunk.length > samplesSize; n = n.split(samplesSize, ctx)[1]);
    return new Zampling.Track({
      chunks: head,
      ctx: ctx
    });
  }
});

Zampling.Tracks = Backbone.Collection.extend({
  model: Zampling.Track
});

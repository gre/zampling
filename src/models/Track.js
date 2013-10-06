
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
    var chunks = this.get("chunks");
    var ctx = this.get("ctx");
    var fromChunk = chunks.split(from, ctx);
    var toChunk = chunks.split(to, ctx);
    var cuttedChunkNode = fromChunk.clone();
    var lastChunk = fromChunk;
    while (lastChunk.next && lastChunk.next!==toChunk) {
      lastChunk = lastChunk.next;
    }
    lastChunk.next = null;
    fromChunk.next = toChunk;
    this._triggerChunksChange();
    return cuttedChunkNode;
  },

  copy: function (from, to) {
    var chunks = this.get("chunks");
    var ctx = this.get("ctx");
    var fromChunk = chunks.split(from, ctx);
    var toChunk = chunks.split(to, ctx);
    var clone = fromChunk.clone();
    var cloneNode = clone;
    for (var n=fromChunk; n.next && n.next!==toChunk; n=n.next) {
      cloneNode.next = n.next.clone();
      cloneNode = cloneNode.next;
    }
    cloneNode.next = null;
    return clone;
  },

  insert: function (chunkNodes, at) {
    var chunks = this.get("chunks"), ctx = this.get("ctx");
    var after = chunks.split(at, ctx);
    var last = chunkNodes.last();
    if (after === chunks) {
      last.next = chunks;
      this.set("chunks", chunkNodes);
    }
    else {
      var before = chunks;
      while (before.next!==after) before = before.next;
      before.next = chunkNodes;
      last.next = after;
      this._triggerChunksChange();
    }
  },

  append: function (node) {
    this.get("chunks").last().next = node;
    this._triggerChunksChange();
  },

  toFloat32Array: function() { // FIXME: rename and refactor to a toAudioBuffer
    var chunk = this.get('chunks');
    var lengthArray = chunk.length();
    var result = new Float32Array(lengthArray);
    var index = 0;

    while(chunk != undefined) {
      var samples = chunk.chunk.audioBuffer.getChannelData(0); // FIXME only support left channel
      // FIXME: we probably can use Float32Array's set function
      for (var i=0; i < chunk.chunk.audioBuffer.length; i++) {
        result[index++] = samples[i];
      }
      chunk = chunk.next
    }
    return result;
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
    for (var i=samplesSize; i<audioBuffer.length; i += samplesSize) {
      head.split(i, ctx);
    }
    return new Zampling.Track({
      chunks: head,
      ctx: ctx
    });
  }
});

Zampling.Tracks = Backbone.Collection.extend({
  model: Zampling.Track
});

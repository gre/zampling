
Zampling.Track = Backbone.Model.extend({
  defaults: {
    width: 600,
    height: 100,
    zoom: 0.01,
    scrollX: 0
  },
  initialize: function (opts) {
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
  cut: function (from, to) {
    var currentChunkNode = this.get("chunks"),
        jump = currentChunkNode.chunk.audioBuffer.length,
        i;

    for(i=jump; i<from; i=i+jump) {
      currentChunkNode = currentChunkNode.next;
      jump = currentChunkNode.chunk.audioBuffer.length;
    }
    if( ! ((i-from) === 0) ) {
       currentChunkNode = currentChunkNode.split(jump - (i-from), this.get("ctx"))
    }

    var cuttedChunkNode = currentChunkNode.next;

    var j;
    var stopChunkNode = cuttedChunkNode;
    var step = stopChunkNode.chunk.audioBuffer.length;

    var distance = to - from;
    for(j=step;j<distance;j=j+step) {
      stopChunkNode = stopChunkNode.next;
      step = stopChunkNode.chunk.audioBuffer.length;
    }

    if( (j-distance) === 0) {
      currentChunkNode.next = stopChunkNode.next;
      stopChunkNode.next = null;
    } else {
      stopChunkNode = stopChunkNode.split( step-(j-distance), this.get("ctx") )
      currentChunkNode.next = stopChunkNode.next;
      stopChunkNode.next = null;

    }
    this.trigger("change:chunks", this, this.get("chunks"));

    return cuttedChunkNode;
  },
  // returns an array which is the split of chunkNode into two chunkNodes
  insert: function (chunkNodes, at) {
    var currentChunkNode = this.get("chunks"),
        step = currentChunkNode.chunk.audioBuffer.length,
        i;
    for(i=step; i<at; i=i+step) {
      currentChunkNode = currentChunkNode.next;
      step = currentChunkNode.chunk.audioBuffer.length;
    }

    if( i != at ) currentChunkNode = currentChunkNode.split(step - (i-at), this.get("ctx"));

    var chunksLoop = chunkNodes;

    while(chunksLoop.next) {
      chunksLoop = chunksLoop.next;
    }

    chunksLoop.next = currentChunkNode.next;
    currentChunkNode.next = chunkNodes;

    this.trigger("change:chunks", this, this.get("chunks"));
  },
  copy: function (from, to) { // returns chunks
    throw "Not Implemented";
  },
  length: function() {
    var length = 0
    var chunk = this.get('chunks');
    while(chunk != undefined) {
      length += chunk.chunk.audioBuffer.length
      chunk = chunk.next
    }
    return length;
  },
  toFloat32Array: function() {
    var lengthArray = this.length()
    var chunk = this.get('chunks');
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
  }
}, {
  DEFAULT_SAMPLES_SIZE: 44100,
  createFromAudioBuffer: function (audioBuffer, ctx, samplesSize) {
    if (!audioBuffer || audioBuffer.length === 0) throw "AudioBuffer is empty.";
    // Cutting in multiple chunks of size 'sampleSize'
    if (!samplesSize) samplesSize = Zampling.Track.DEFAULT_SAMPLES_SIZE

    var length = audioBuffer.length;
    var float32ArrayBuffer = audioBuffer.getChannelData(0); // FIXME only left supported

    var chunks = [];
    for (var i=0; i<length; i += samplesSize) {
      var size = Math.min(length-i, samplesSize);
      var audioBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
      var floatArray = audioBuffer.getChannelData(0);
      floatArray.set(float32ArrayBuffer.subarray(i, i+size));
      var chunk = new Zampling.Chunk(audioBuffer);
      chunks.push(chunk);
    }

    var head = _.reduceRight(chunks, function (nextChunk, chunk) {
      return new Zampling.ChunkNode(chunk, nextChunk);
    }, null);

    return new Zampling.Track({
      chunks: head,
      ctx: ctx
    });
  }
});

Zampling.Tracks = Backbone.Collection.extend({
  model: Zampling.Track
});

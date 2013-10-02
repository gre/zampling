
Zampling.Track = Backbone.Model.extend({
  defaults: {
    width: 600,
    height: 100,
    zoom: 0.01,
    scrollX: 0
  },
  initialize: function (opts) {
  },
  getStat: function (from, to) {
    var min = Infinity, max = -Infinity;
    var currentChunkI = 0;
    var currentChunkNode = this.get("chunks");
    var currentChunkSize = currentChunkNode.chunk.samples.length;
    for (var i = from; i < to; ++i) {
      while (currentChunkNode && i > currentChunkI + currentChunkSize) {
        currentChunkI += currentChunkSize;
        currentChunkNode = currentChunkNode.next;
        if (currentChunkNode) {
          currentChunkSize = currentChunkNode.chunk.samples.length;
        }
      }
      if (!currentChunkNode) break;
      var value = currentChunkNode.chunk.samples[i-currentChunkI];
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
        jump = currentChunkNode.chunk.samples.length,
        i;

    for(i=jump; i<from; i=i+jump) {
      currentChunkNode = currentChunkNode.next;
      jump = currentChunkNode.chunk.samples.length;
    }
    if( ! ((i-from) === 0) ) {
      console.log("cutting at ", jump - (i-from));
       currentChunkNode = currentChunkNode.split(jump - (i-from), this.get("ctx"))
    }

    var cuttedChunkNode = currentChunkNode.next;

    var j;
    var stopChunkNode = cuttedChunkNode;
    var step = stopChunkNode.chunk.samples.length;
    
    var distance = to - from;
    for(j=step;j<distance;j=j+step) {
      stopChunkNode = stopChunkNode.next;
      step = stopChunkNode.chunk.samples.length;
    }

    if( (j-distance) === 0) {
      currentChunkNode.next = stopChunkNode.next;
      stopChunkNode.next = null;
    } else {
      stopChunkNode = stopChunkNode.split( step-(j-distance), this.get("ctx") )
      currentChunkNode.next = stopChunkNode.next;
      stopChunkNode.next = null;

    }
    return cuttedChunkNode;
  },
  // returns an array which is the split of chunkNode into two chunkNodes
  insert: function (chunks, at) {
    throw "Not Implemented";
  },
  copy: function (from, to) { // returns chunks
    throw "Not Implemented";
  },
  length: function() {
    var length = 0
    var chunk = this.get('chunks');
    while(chunk != undefined) {
      length += chunk.chunk.samples.length
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
      for (var i=0; i < chunk.chunk.samples.length; i++) {
        result[index++] = chunk.chunk.samples[i]
      }
      chunk = chunk.next
    }
    return result;
  }
}, {
  DEFAULT_SAMPLES_SIZE: 44100,
  createFromArrayBuffer: function (float32ArrayBuffer, ctx, samplesSize) {
    if (!float32ArrayBuffer || float32ArrayBuffer.length === 0) throw "float32ArrayBuffer is empty.";
    // Cutting in multiple chunks of size 'sampleSize'
    if (!samplesSize) samplesSize = Zampling.Track.DEFAULT_SAMPLES_SIZE

    var length = float32ArrayBuffer.length;
    
    var chunks = [];
    for (var i=0; i<length; i += samplesSize) {
      var size = Math.min(length-i, samplesSize);
      var audioBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
      var floatArray = audioBuffer.getChannelData(0);
      floatArray.set(float32ArrayBuffer.subarray(i, i+size));
      var chunk = new Zampling.Chunk(floatArray, audioBuffer);
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

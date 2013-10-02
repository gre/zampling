
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
    var firstChunkNode, secondChunkNode;
    var currentChunkNode = this.get("chunks");
    var jump = currentChunkNode.chunk.samples.length;
    var i;
    for(i=jump; i<from; i=i+jump) {
      currentChunkNode = currentChunkNode.next;
      jump = currentChunkNode.chunk.samples.length;
    }
    if( (i-from) === 0) {
       firstNode = currentChunkNode;
    } else {
      firstNode = currentChunkNode;
      firstNo
      console.log("You should move by", jump - (i-fconsolrom) );
    }


    //create chunk from start of this chunkNode to From
    // its next is the chunk we are going to create
    // change next of its previous

    // create chunk from To to end of this chunk
    // its next is currentChunkNode.next
    

    //var i = jump;
    // while(i<from) {      
    //   currentChunkNode = currentChunkNode.next;
    //   jump = currentChunkNode.chunk.samples.length;
    //   i = i + jump;
    // }
  },
  // returns an array which is the split of chunkNode into two chunkNodes
  split: function(chunkNode, at) {
    // if(chunkNode.chunk.samples.length > at) {
    //   var firstChunk = new Zampling.Chunk(chunkNode.samples.subarray(0, at),  ).set(float32ArrayBuffer.subarray(i, i+size)
    //   var secondChunk = 
    //   var secondChunkNode = new Zampling.ChunkNode(secondChunk, chunkNode.next);
    //   var firstChunkNode = new Zampling.ChunkNode(firstChunk, secondChunkNode);
    //   splited = [, new Zampling.ChunkNode(secondChunk, chunkNode.next)]
    // } else {
    //   throw "Cannot split at given position"
    // }
  },
  insert: function (chunks, at) {
    throw "Not Implemented";
  },
  copy: function (from, to) { // returns chunks
    throw "Not Implemented";
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
      chunks: head
    });
  }
});

Zampling.Tracks = Backbone.Collection.extend({
  model: Zampling.Track
});

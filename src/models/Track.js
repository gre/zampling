Zampling.Track = Backbone.Model.extend({
  initialize: function (opts) {
  },
  cut: function (from, to) {
    throw "Not Implemented";
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
    // TODO cut in multiple chunks
    if (!samplesSize) samplesSize = Zampling.Track.DEFAULT_SAMPLES_SIZE;

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

Zampling.Chunk = function(samples, audioBuffer) {
  this.samples = samples;
  this.audioBuffer = audioBuffer;
}

Zampling.Chunk.prototype.splice = function(at, ctx) {
  var audioBuffer1 = ctx.createBuffer(1, at, ctx.sampleRate),
      audioBuffer2 = ctx.createBuffer(1, (this.samples.length - at), ctx.sampleRate),
      floatArray1 = audioBuffer1.getChannelData(0),
      floatArray2 = audioBuffer2.getChannelData(0);

  floatArray1.set(this.samples.subarray(0, at));
  floatArray2.set(this.samples.subarray(at, this.samples.length));

  var chunk1 = new Zampling.Chunk(floatArray1, audioBuffer1),
      chunk2 = new Zampling.Chunk(floatArray2, audioBuffer2);

  return [chunk1, chunk2];
}

Zampling.ChunkNode = function(chunk, nextChunkNode)  {
  this.chunk = chunk;
  this.next = nextChunkNode;
}

Zampling.ChunkNode.prototype.clone = function() {
  return new Zampling.ChunkNode(this.chunk, this.next)
}

Zampling.ChunkNode.prototype.forEach = function(f, ctx) {
  f.call(ctx, this);
  if(this.next) this.next.forEach(f, ctx);
}

Zampling.ChunkNode.prototype.take = function(n) {
  if(n == 0) return null
  var clone = this.clone()
  clone.next = this.next.take(n - 1)
  return clone
}

Zampling.ChunkNode.prototype.reverse = function() {
  var clone = this.clone()
  clone.next = null
  var reversed = this
  if(this.next) {
    reversed = this.next.reverse()
    reversed.next = clone
  }
  return reversed
}

Zampling.ChunkNode.prototype.splice = function(at, ctx) {
  var chunks = this.chunk.splice(at, ctx),
      chunkNode2 = new Zampling.ChunkNode(chunks[1], this.next),
      chunkNode1 = new Zampling.ChunkNode(chunks[0], chunkNode2);

  return [chunkNode1, chunkNode2];
}

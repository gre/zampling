Zampling.Chunk = function(samples, audioBuffer) {
  this.samples = samples;
  this.audioBuffer = audioBuffer;
}

Zampling.Chunk.prototype.split = function(at, ctx) {
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

Zampling.ChunkNode.prototype.last = function(node) {
  if(this.next) this.next.last(node)
  else this.next = node
  return this
}

Zampling.ChunkNode.prototype.reverse = function() {
  var clone = this.clone()
  clone.next = null
  var reversed = clone
  if(this.next) {
    reversed = this.next.reverse()
    reversed.last(clone)
  }
  return reversed
}

Zampling.ChunkNode.prototype.split = function(at, ctx) {
  var chunks = this.chunk.split(at, ctx),
      chunkNode = new Zampling.ChunkNode(chunks[1], this.next);
  this.chunk = chunks[0],
  this.next = chunkNode;

  return this;
}

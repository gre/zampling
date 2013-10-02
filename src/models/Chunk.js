Zampling.Chunk = function(samples) {
  this.samples = samples;
}

Zampling.ChunkNode = function(chunk, nextChunk)  {
  this.chunk = chunk;
  this.next = nextChunk;
}

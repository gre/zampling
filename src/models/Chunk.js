Zampling.Chunk = function(samples, audioBuffer) {
  this.samples = samples;
  this.audioBuffer = audioBuffer;
}

Zampling.ChunkNode = function(chunk, nextChunkNode)  {
  this.chunk = chunk;
  this.next = nextChunkNode;
}

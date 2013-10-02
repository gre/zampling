Zampling.Chunk = function(samples, audioBuffer) {
  this.samples = samples;
  this.audioBuffer = audioBuffer;
}

Zampling.Chunk.prototype.splice = function(start, end) {

}

Zampling.ChunkNode = function(chunk, nextChunkNode)  {
  this.chunk = chunk;
  this.next = nextChunkNode;
}

Zampling.ChunkNode.prototype.clone = function() {
  return new Zampling.ChunkNode(this.chunk, this.next)
}

Zampling.ChunkNode.prototype.forEach = function(f) {
  f(this)
  if(this.next) this.next.forEach(f)
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

// A chunk represents a portion of an Audio Buffer
// A Chunk is immutable: all functions returns new chunks and never change the original one.

Zampling.Chunk = function(audioBuffer) {
  this.audioBuffer = audioBuffer;
  this.length = audioBuffer.length;
}

Zampling.Chunk.prototype = {
  clone: function (ctx) {
    var buffer = ctx.createBuffer(1, this.audioBuffer.length, ctx.sampleRate);
    var thisArray = this.audioBuffer.getChannelData(0); // FIXME only support left channel
    var floatArray = buffer.getChannelData(0);
    floatArray.set(thisArray);
    return new Zampling.Chunk(buffer);
  },

  merge: function (other) {
    throw "NotImplemented";
  },

  split: function(at, ctx) {
    var samples = this.audioBuffer.getChannelData(0);
    var audioBuffer1 = ctx.createBuffer(1, at, ctx.sampleRate),
        audioBuffer2 = ctx.createBuffer(1, (this.audioBuffer.length - at), ctx.sampleRate),
        floatArray1 = audioBuffer1.getChannelData(0),
        floatArray2 = audioBuffer2.getChannelData(0);

    // FIXME: only doing on left channel
    floatArray1.set(samples.subarray(0, at));
    floatArray2.set(samples.subarray(at, samples.length));

    var chunk1 = new Zampling.Chunk(audioBuffer1),
        chunk2 = new Zampling.Chunk(audioBuffer2);

    return [chunk1, chunk2];
  }
};

// A ChunkNode represents a Chained list of chunk
// A ChunkNode is mutable: functions will transform the existing structure. Use clone() to copy it.

Zampling.ChunkNode = function(chunk, nextChunkNode)  {
  this.chunk = chunk;
  this.next = nextChunkNode;
}

Zampling.ChunkNode.prototype = {
  // Create a full copy of the ChunkNode list
  copy: function (ctx) {
    return new Zampling.ChunkNode(this.chunk.clone(ctx), this.next ? this.next.copy(ctx) : null);
  },

  // Only clone a node
  clone: function() {
    return new Zampling.ChunkNode(this.chunk, this.next);
  },

  forEach: function(f, fcontext) {
    for (var node = this; node; node = node.next) {
      f.call(fcontext||f, node);
    }
  },

  map: function(f, fcontext) {
    var t = [];
    for (var node = this; node; node = node.next) {
      t.push(f.call(fcontext||f, node));
    }
    return t;
  },

  length: function () {
    var length = 0;
    this.forEach(function(node) {
      length += node.chunk.length;
    });
    return length;
  },

  find: function (iterator, itctx) {
    for (var node = this; node; node = node.next) {
      if (iterator.call(itctx||iterator, node)) {
        return node;
      }
    }
    return null;
  },

  last: function () {
    var node = this;
    while (node.next) node = node.next;
    return node;
  },

  // Merge with the next chunk
  merge: function () {
    throw "NotImplemented";
  },

  // Split the Chunk list at a given position and return the right part of the split
  split: function (at, ctx) {
    if (at === 0) {
      return this;
    }
    else if (at < this.chunk.length) {
      var chunks = this.chunk.split(at, ctx),
          chunkNode = new Zampling.ChunkNode(chunks[1], this.next);
      this.chunk = chunks[0],
      this.next = chunkNode;
      return chunkNode;
    }
    else if (this.chunk.length <= at && this.next) {
      return this.next.split(at-this.chunk.length, ctx);
    }
    else {
      throw new Error("Invalid split");
    }
  }
}

// Following probably not required anymore
/*
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
*/

// A chunk represents a portion of an Audio Buffer
// A Chunk is immutable: all functions returns new chunks and never change the original one.

Zampling.Chunk = function(audioBuffer) {
  this.audioBuffer = audioBuffer;
  this.length = audioBuffer.length;
};

Zampling.Chunk.prototype = {
  clone: function (ctx) {
    var buffer = ctx.createBuffer(1, this.length, ctx.sampleRate);
    var thisArray = this.audioBuffer.getChannelData(0); // FIXME only support left channel
    var floatArray = buffer.getChannelData(0);
    floatArray.set(thisArray);
    return new Zampling.Chunk(buffer);
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
  this.next = nextChunkNode || null;
};

Zampling.ChunkNode.prototype = {
  // Create a full copy of the ChunkNode list
  copy: function (ctx) {
    return new Zampling.ChunkNode(this.chunk.clone(ctx), this.next ? this.next.copy(ctx) : null);
  },

  // Only clone a node
  clone: function() {
    return new Zampling.ChunkNode(this.chunk, this.next);
  },

  set: function (chunkNode) {
    this.chunk = chunkNode.chunk;
    this.next = chunkNode.next;
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

  // Merge all next chunks
  merge: function (ctx) {
    var buffer = ctx.createBuffer(1, this.length(), ctx.sampleRate);
    var data = buffer.getChannelData(0);
    var offset = 0;
    this.forEach(function (node) {
      data.set(node.chunk.audioBuffer.getChannelData(0), offset);
      offset += node.chunk.length;
    });
    this.chunk = new Zampling.Chunk(buffer);
    this.next = null;
    return this;
  },

  append: function (node) {
    this.last().next = node;
    return this;
  },

  // Split the Chunk list at a given position and return the [left,right] part of the split
  split: function (at, ctx, prevNode) {
    if (at === 0) {
      return [prevNode||null, this];
    }
    else if (at < this.chunk.length) {
      var chunks = this.chunk.split(at, ctx),
          chunkNode = new Zampling.ChunkNode(chunks[1], this.next);
      this.chunk = chunks[0],
      this.next = chunkNode;
      return [this, chunkNode];
    }
    else if (this.chunk.length <= at && this.next) {
      return this.next.split(at-this.chunk.length, ctx, this);
    }
    else {
      throw new Error("index out of bound ("+at+")");
    }
  },

  // Remove a slice of the original chunklist and returns this slice.
  slice: function (ctx, from, to) {
    if (typeof from !== "number") throw new Error("from is required");
    if (!to) to = this.length();
    var fromChunks = this.split(from, ctx);
    var toChunks = this.split(to, ctx);
    var cuttedChunkNode = fromChunks[1].clone();
    toChunks[0].next = null;
    fromChunks[1].next = toChunks[1];
    return cuttedChunkNode;
  },

  // Preserve the original chunklist and returns a slice.
  subset: function (ctx, from, to) {
    if (typeof from !== "number") throw new Error("from is required");
    if (!to) to = this.length();
    var fromChunk = this.split(from, ctx)[1];
    var toChunk = this.split(to, ctx)[1];
    var clone = fromChunk.clone();
    var cloneNode = clone;
    for (var n=fromChunk; n.next && n.next!==toChunk; n=n.next) {
      cloneNode.next = n.next.clone();
      cloneNode = cloneNode.next;
    }
    cloneNode.next = null;
    return clone;
  },

  insert: function (ctx, chunkNodes, at) {
    var splits = this.split(at, ctx);
    var before = splits[0];
    var after = splits[1];
    var last = chunkNodes.last();
    if (before) {
      before.next = chunkNodes;
      last.next = after;
    }
    else {
      last.next = this.clone();
      this.set(chunkNodes);
    }
    return this;
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

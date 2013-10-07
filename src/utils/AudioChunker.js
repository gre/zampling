
AudioChunker = function (audioContext) {
  var lib = {};

  lib.context = audioContext;

  lib.DEFAULT_SAMPLES_SIZE = 44100;
  lib.createFromAudioBuffer = function (audioBuffer, samplesSize) {
    if (!audioBuffer || audioBuffer.length === 0) throw "AudioBuffer is empty.";
    if (!samplesSize) samplesSize = lib.DEFAULT_SAMPLES_SIZE;
    var head = new lib.ChunkNode(new lib.Chunk(audioBuffer), null);
    for (var n=head; n.chunk.length > samplesSize; n = n.split(samplesSize)[1]);
    return head;
  };

  // A chunk represents a portion of an Audio Buffer
  // A Chunk is immutable: all functions returns new chunks and never change the original one.
  lib.Chunk = function(audioBuffer) {
    this.audioBuffer = audioBuffer;
    this.length = audioBuffer.length;
  };

  lib.Chunk.prototype = {
    getAudioBuffer: function () {
      return this.audioBuffer;
    },

    forEachChannel: function (f, fcontext) {
      var numberOfChannels = this.audioBuffer.numberOfChannels;
      for (var i=0; i<numberOfChannels; ++i)
        f.call(fcontext||f, this.audioBuffer.getChannelData(i), i);
    },

    clone: function () {
      var buffer = audioContext.createBuffer(this.audioBuffer.numberOfChannels, this.length, audioContext.sampleRate);
      var clone = new lib.Chunk(buffer);
      clone.forEachChannel(function (channel, i) {
        channel.set(this.audioBuffer.getChannelData(i));
      }, this);
      return clone;
    },

    split: function(at) {
      var numberOfChannels = this.audioBuffer.numberOfChannels;
      var audioBuffer1 = audioContext.createBuffer(numberOfChannels, at, audioContext.sampleRate);
      var audioBuffer2 = audioContext.createBuffer(numberOfChannels, (this.length - at), audioContext.sampleRate);
      this.forEachChannel(function (samples, i) {
        audioBuffer1.getChannelData(i).set(samples.subarray(0, at));
        audioBuffer2.getChannelData(i).set(samples.subarray(at, samples.length));
      });
      return [new lib.Chunk(audioBuffer1), new lib.Chunk(audioBuffer2)];
    }
  };

  // A ChunkNode represents a Chained list of chunk
  // A ChunkNode is mutable: functions will transform the existing structure. Use clone() to copy it.

  lib.ChunkNode = function(chunk, nextChunkNode)  {
    this.chunk = chunk;
    this.next = nextChunkNode || null;
  };

  lib.ChunkNode.prototype = {
    // Create a full copy of the ChunkNode list
    copy: function () {
      return new lib.ChunkNode(this.chunk.clone(), this.next ? this.next.copy() : null);
    },

    // Only clone a node
    clone: function() {
      return new lib.ChunkNode(this.chunk, this.next);
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
    merge: function () {
      var buffer = audioContext.createBuffer(this.chunk.audioBuffer.numberOfChannels, this.length(), audioContext.sampleRate);
      var chunk = new lib.Chunk(buffer);
      chunk.forEachChannel(function (channel, i) {
        var offset = 0;
        this.forEach(function (node) {
          channel.set(node.chunk.audioBuffer.getChannelData(i), offset);
          offset += node.chunk.length;
        });
      }, this);
      this.chunk = chunk;
      this.next = null;
      return this;
    },

    append: function (node) {
      this.last().next = node;
      return this;
    },

    // Split the Chunk list at a given position and return the [left,right] part of the split
    split: function (at, prevNode) {
      if (at === 0) {
        return [prevNode||null, this];
      }
      else if (at < this.chunk.length) {
        var chunks = this.chunk.split(at),
            chunkNode = new lib.ChunkNode(chunks[1], this.next);
        this.chunk = chunks[0],
        this.next = chunkNode;
        return [this, chunkNode];
      }
      else if (this.chunk.length <= at && this.next) {
        return this.next.split(at-this.chunk.length, this);
      }
      else {
        throw new Error("index out of bound ("+at+")");
      }
    },

    // Remove a slice of the original chunklist and returns this slice.
    slice: function (from, to) {
      if (typeof from !== "number") throw new Error("from is required");
      if (!to) to = this.length();
      var fromChunks = this.split(from);
      var toChunks = this.split(to);
      var cuttedChunkNode = fromChunks[1].clone();
      toChunks[0].next = null;
      fromChunks[1].next = toChunks[1];
      return cuttedChunkNode;
    },

    // Preserve the original chunklist and returns a slice.
    subset: function (from, to) {
      if (typeof from !== "number") throw new Error("from is required");
      if (!to) to = this.length();
      var fromChunk = this.split(from)[1];
      var toChunk = this.split(to)[1];
      var clone = fromChunk.clone();
      var cloneNode = clone;
      for (var n=fromChunk; n.next && n.next!==toChunk; n=n.next) {
        cloneNode.next = n.next.clone();
        cloneNode = cloneNode.next;
      }
      cloneNode.next = null;
      return clone;
    },

    insert: function (chunkNodes, at) {
      var splits = this.split(at);
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

  return lib;
};


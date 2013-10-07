
AudioChunker = function (audioContext) {
  var lib = {};

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
    clone: function () {
      var buffer = audioContext.createBuffer(1, this.length, audioContext.sampleRate);
      var thisArray = this.audioBuffer.getChannelData(0); // FIXME only support left channel
      var floatArray = buffer.getChannelData(0);
      floatArray.set(thisArray);
      return new lib.Chunk(buffer);
    },

    split: function(at) {
      var samples = this.audioBuffer.getChannelData(0);
      var audioBuffer1 = audioContext.createBuffer(1, at, audioContext.sampleRate),
          audioBuffer2 = audioContext.createBuffer(1, (this.audioBuffer.length - at), audioContext.sampleRate),
          floatArray1 = audioBuffer1.getChannelData(0),
          floatArray2 = audioBuffer2.getChannelData(0);

      // FIXME: only doing on left channel
      floatArray1.set(samples.subarray(0, at));
      floatArray2.set(samples.subarray(at, samples.length));

      var chunk1 = new lib.Chunk(audioBuffer1),
          chunk2 = new lib.Chunk(audioBuffer2);

      return [chunk1, chunk2];
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
      var buffer = audioContext.createBuffer(1, this.length(), audioContext.sampleRate);
      var data = buffer.getChannelData(0);
      var offset = 0;
      this.forEach(function (node) {
        data.set(node.chunk.audioBuffer.getChannelData(0), offset);
        offset += node.chunk.length;
      });
      this.chunk = new lib.Chunk(buffer);
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

// FIXME namespace

var Encoder = {}

Encoder.floatTo16BitPCM = function (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

Encoder.trackFloatTo16BitPCM = function (output, offset, inputTrack) {

  for (var i = 0; i < input.length; i++, offset+=2){
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

Encoder.writeString = function (view, offset, string){
  for (var i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

Encoder.interleave = function (channelsAudioArray) {
  var lengthChannels = channelsAudioArray.length
  var length = channelsAudioArray[0].length * lengthChannels
  var result = new Float32Array(length);

  var index = 0,
    inputIndex = 0;
  
  while (index < length){
    for (var i=0; i < lengthChannels; i++) {
      result[index++] = channelsAudioArray[i][inputIndex]
    }
    inputIndex++;
  }
  return result;
}

Encoder.encodeWAV = function(channelsAudioArray) {

  function EncodeWAV(channelsAudioArray) {
    var samples = Encoder.interleave(channelsAudioArray)
    var sampleRate = 44100;
  
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);
  
    /* RIFF identifier */
    Encoder.writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 32 + samples.length * 2, true);
    /* RIFF type */
    Encoder.writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    Encoder.writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, channelsAudioArray.length, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 4, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    Encoder.writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);
  
    Encoder.floatTo16BitPCM(view, 44, samples);
  
    return view;
  }

  return EncodeWAV(channelsAudioArray);
}

function QaudioXHR (ctx, url) {
  var d = Q.defer();
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    ctx.decodeAudioData(request.response, d.resolve, d.reject);
  };
  request.onerror = d.reject;
  request.send();
  return d.promise;
}

function QaudioFileInput (context, fileInput) {
  var d = Q.defer();
  var reader = new FileReader();
  reader.onload = function(e) {
    context.decodeAudioData(this.result, d.resolve, d.reject);
  };
  reader.onerror = d.reject;
  reader.readAsArrayBuffer(fileInput.files[0]);
  return d.promise;
}




Zampling.createRecorderNode = function (ctx, giveBuffer) {
  var bufferSize = 2048;
  var numberOfChannels = 2;
  var processor = ctx.createJavaScriptNode(bufferSize, numberOfChannels, numberOfChannels);
  processor.onaudioprocess = function(e) {
    var buffer = ctx.createBuffer(numberOfChannels, bufferSize, ctx.sampleRate);
    for (var i=0; i<numberOfChannels; ++i) {
      buffer.getChannelData(i).set(new Float32Array(e.inputBuffer.getChannelData(i)));
    }
    giveBuffer(buffer);
  };
  return processor;
}

Zampling.Player = Backbone.Model.extend({
  defaults: {
    playing: false
  },
  initialize: function() {
    this.ctx = new (window.webkitAudioContext || window.AudioContext)();

    var compressor = this.ctx.createDynamicsCompressor();
    compressor.connect(this.ctx.destination)
    this.destination = compressor

    var gain = this.ctx.createGain()
    gain.gain.value = 1
    gain.connect(compressor)

    this.tracks = new Zampling.Tracks();
    this.sources = [];

    this.triggerPlaying = _.bind(this._triggerPlaying, this);
    this.set("playing", false);
  },
  _triggerPlaying: function () {
    this.trigger("playing", this.ctx.currentTime-this.get("playStartAt")+this.get("playPosition"));
  },
  play: function (position, stopAtPosition) {
    if (!position) position = 0;
    if (!stopAtPosition) stopAtPosition = Infinity;
    if (this.get("playing")) return;
    this.set("playing", true);
    this.set("playPosition", position);
    var currentTime = this.ctx.currentTime;
    this.set("playStartAt", currentTime);
    this.trigger("playing", this.ctx.currentTime-this.get("playStartAt")+this.get("playPosition"));
    var maxDuration = -Infinity;
    this.tracks.each(function (track) {
      var when = -position;
      track.get("chunks").forEach(function(node) {
        var source = this.ctx.createBufferSource()
        source.buffer = node.chunk.audioBuffer
        source.connect(this.destination)
        var duration = node.chunk.audioBuffer.duration;
        var start = when;
        if (when < stopAtPosition) {
          when += duration;
          if (when > 0) {
            var playoffset = Math.max(0, duration - when);
            var playduration = Math.min(duration, stopAtPosition - when);
            source.start(currentTime + start, playoffset, playduration);
            maxDuration = Math.max(start + playduration, maxDuration);
            this.sources.push(source);
          }
        }
      }, this);
    }, this);
    /*
    var playendPromise = Q.all(_.map(this.sources, function (s) {
      var d = Q.defer();
      s.addEventListener("ended", d.resolve);
      return d.promise;
    }));
    playendPromise.then(function() {
      console.log("done");
    });
    */
    playendPromise = Q.delay(1000 * maxDuration); // FIXME

    playendPromise.then(_.bind(this.stop, this));
    setInterval(this.triggerPlaying, 100);
    this.trigger("play", playendPromise);
  },
  stop: function () {
    if (!this.get("playing")) return;
    this.sources.forEach(function(s) { s.stop(0) });
    this.sources = [];
    clearInterval(this.triggerPlaying);
    this.set("playing", false);
    this.trigger("stop");
  }
});


Zampling.Track = Backbone.Model.extend({
  defaults: {
    width: 600,
    height: 100,
    zoom: 0.01,
    scrollX: 0
  },

  initialize: function (opts) {
  },

  cut: function (from, to) {
    var cuttedChunkNode = this.get("chunks").slice(from, to);
    this._triggerChunksChange();
    return cuttedChunkNode;
  },

  copy: function (from, to) {
    return this.get("chunks").subset(from, to);
  },

  insert: function (chunkNodes, at) {
    this.get("chunks").insert(chunkNodes, at);
    this._triggerChunksChange();
  },

  append: function (node) {
    this.get("chunks").append(node);
    this._triggerChunksChange();
  },

  toAudioBuffer: function() {
    var node = this.get("chunks").copy().merge();
    return node.chunk.audioBuffer;
  },

  getCursorStartTime: function () {
    return this.get("cursorstartx") / (this.get("zoom") * this.get("sampleRate"));
  },

  getCursorEndTime: function () {
    return this.get("cursorendx") / (this.get("zoom") * this.get("sampleRate"));
  },

  getStat: function (from, to) {
    var min = Infinity, max = -Infinity;
    var currentChunkI = 0;
    var currentChunkNode = this.get("chunks");
    var currentChunkSize = currentChunkNode.chunk.audioBuffer.length;
    var currentSamples = currentChunkNode.chunk.audioBuffer.getChannelData(0); // FIXME only on left channel
    for (var i = from; i < to; ++i) {
      while (currentChunkNode && i > currentChunkI + currentChunkSize) {
        currentChunkI += currentChunkSize;
        currentChunkNode = currentChunkNode.next;
        if (currentChunkNode) {
          currentChunkSize = currentChunkNode.chunk.audioBuffer.length;
          currentSamples = currentChunkNode.chunk.audioBuffer.getChannelData(0);
        }
      }
      if (!currentChunkNode) break;
      var value = currentSamples[i-currentChunkI];
      if (value < min) min = value;
      if (value > max) max = value;
    }
    return {
      min: min,
      max: max
    };
  },

  _triggerChunksChange: function (opts) {
    this.trigger("change:chunks", this, this.get("chunks"), opts||{});
    this.trigger("change", this, opts||{});
  }
});

Zampling.Tracks = Backbone.Collection.extend({
  model: Zampling.Track
});

Zampling.ControlsView = Backbone.View.extend({
  initialize: function () {

    this.$div = $('<div class="blue ui buttons" style="margin:10px"></div>');
    this.$play = $('<div class="ui icon button action-play"><i class="play icon"></i></div>');
    this.$stop = $('<div class="ui icon button action-stop"><i class="stop icon"></i></div>');
    this.$export = $('<div class="ui right labeled icon button action-download green"><i class="right download disk icon"></i>Download</div>');
    this.$zoomin = $('<div class="action-zoomin ui icon button"><i class="zoom in icon"></i></div>');
    this.$zoomDiv = $('<div class="blue ui buttons" style="margin:10px"></div>');
    this.$zoomout = $('<div class="action-zoomout ui icon button"><i class="zoom out icon"></i></div>');

    this.$opDiv = $('<div class="blue ui buttons" style="margin:10px"></div>');
    this.$copy = $('<div class="action-copy ui icon button"><i class="copy icon"></i></div>');
    this.$cut = $('<div class="action-cut ui icon button"><i class="cut icon"></i></div>');
    this.$paste = $('<div class="action-paste ui icon button"><i class="paste icon"></i></div>');

    this.$div.append(this.$play);
    this.$div.append(this.$stop);
    this.$el.append(this.$div);
    this.$el.append(this.$export);
    this.$zoomDiv.append(this.$zoomin);
    this.$zoomDiv.append(this.$zoomout);
    this.$el.append(this.$zoomDiv);
    this.$opDiv.append(this.$cut);
    this.$opDiv.append(this.$copy);
    this.$opDiv.append(this.$paste);
    this.$el.append(this.$opDiv);
  },
  events: {
    "click .action-play": "onPlay",
    "click .action-stop": "onStop",
    "click .action-download": "onDownload",
    "click .action-zoomin": "onZoomIn",
    "click .action-zoomout": "onZoomOut",
    "click .action-copy": "onCopy",
    "click .action-cut": "onCut",
    "click .action-paste": "onPaste"
  },
  onPlay: function () {
    this.model.trigger("button-play");
  },
  onStop: function () {
    this.model.trigger("button-stop");
  },
  onDownload: function () {
    this.model.trigger("button-download");
  },
  onZoomIn: function () {
    this.model.trigger("button-zoomin");
  },
  onZoomOut: function () {
    this.model.trigger("button-zoomout");
  },
  onCopy: function () {
    this.model.trigger("button-copy");
  },
  onCut: function () {
    this.model.trigger("button-cut");
  },
  onPaste: function () {
    this.model.trigger("button-paste");
  }
  
});

Zampling.TrackView = Backbone.View.extend({
  className: "track",
  initialize: function (opts) {
    this.MIN_DELTA = 8;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.$cursor = $('<div class="cursor"></div>');
    this.$selection = $('<div class="selection"></div>');
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "change:zoom", this.render);
    this.listenTo(this.model, "change:chunks", this.render);
    this.listenTo(this.model, "change:cursorstartx change:cursorendx", this.syncCursor);
    this.listenTo(this.model, "change:cursormode", this.syncCursorMode);

    this.$el.append(this.canvas);
    this.$el.append(this.$cursor);
    this.$el.append(this.$selection);

    this.syncSize();
  },
  events: {
    "mousedown": "onMouseDown",
    "mouseup": "onMouseUp",
    "mousemove": "onMouseMove"
  },
  onMouseDown: function (e) {
    e.preventDefault();
    var x = e.clientX - this.canvas.getBoundingClientRect().left;
    this.model.set({
      "cursormode": "cursor",
      "cursorstartx": x,
      "cursorendx": null,
      "moving": true
    });
  },
  onMouseUp: function (e) {
    var x = e.clientX - this.canvas.getBoundingClientRect().left;
    this.model.set({
      "cursorendx": x,
      "moving": false
    });
  },
  onMouseMove: function (e) {
    if (!this.model.get("moving")) return;
    var x = e.clientX - this.canvas.getBoundingClientRect().left;
    this.model.set("cursorendx", x);
  },
  syncCursorMode: function () {
    var mode = this.model.get("cursormode");
    if (mode == "cursor") {
      this.$cursor.show();
      this.$selection.hide();
    }
    else if (mode == "selection") {
      this.$selection.show();
      this.$cursor.hide();
    }
  },
  syncCursor: function () {
    var startx = this.model.get("cursorstartx");
    var endx = this.model.get("cursorendx");
    if (Math.abs(startx-endx) < this.MIN_DELTA) {
      this.model.set("cursormode", "cursor");
      this.$cursor.css({
        left: Math.round(startx)+"px"
      });
    }
    else {
      this.model.set("cursormode", "selection");
      this.$selection.css({
        left: Math.round(startx)+"px",
        width: Math.round(endx-startx)+"px"
      });
    }
  },
  syncSize: function () {
    var W = this.model.get("width");
    var H = this.model.get("height");
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = dpr * W;
    this.canvas.height = dpr * H;
    this.canvas.style.width = W+"px";
    this.canvas.style.height = H+"px";
    this.render();
  },
  render: function () {
    var ctx = this.ctx;
    var W = ctx.canvas.width;
    var H = ctx.canvas.height;
    var dpr = window.devicePixelRatio || 1;
    var zoom = this.model.get("zoom");
    var samplesPerZoom = Math.floor(1 / (zoom*dpr));
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#6ECFF5";
    var from = 0;
    if (zoom < 1) {
      for (var x = 0; x < W; ++x) {
        var stat = this.model.getStat(from, from+samplesPerZoom);
        var yStart = H * (1 - (stat.max + 1)/2);
        var yStop = H * (1 - (stat.min + 1)/2);
        ctx.fillRect(x, yStart, 1, yStop-yStart);
        from += samplesPerZoom;
      }
    }
    else {
      // TODO: other viz mode!
      throw "zoom level >= 1, Not Implemented";
    }
  }
});

// polyfill
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

(function () {
  var $record = $("#record");
  var $stopRecord = $("#stopRecord");
  var $tracks = $("#tracks");

  var ctx = new (window.webkitAudioContext || window.AudioContext)();
  var audioChunker = new AudioChunker(ctx);

  var eventuallyMediaStream = (function(d) {
    navigator.getUserMedia({ audio: true }, d.resolve, d.reject);
    return d.promise;
  } (Q.defer()));

  var eventuallyMicrophone = eventuallyMediaStream.then(function (mediaStream) {
    var mic = ctx.createMediaStreamSource(mediaStream);
    var gain = ctx.createGain();
    var compressor = ctx.createDynamicsCompressor();
    gain.gain.value = 4;
    mic.connect(gain);
    gain.connect(compressor);
    return compressor;
  });

  function createTrackFromAudioBuffer (audioBuffer) {
    var chunks = audioChunker.createFromAudioBuffer(audioBuffer);
    return new Zampling.Track({
      sampleRate: ctx.sampleRate,
      chunks: chunks
    });
  };

  var player = new Zampling.Player();

  var controlView = new Zampling.ControlsView({
    model: player,
    el: $('#controls')
  });

  player.tracks.on("add", function (track) {
    var trackView = new Zampling.TrackView({
      model: track
    });
    trackView.$el.appendTo($tracks);
    track.on("change:cursormode", function () {
      player.set("currentTrack", track);
    });
  });

  var $playCursor = $('<div class="play-cursor" />');
  $playCursor.hide();
  $tracks.append($playCursor);

  player.on("play", function () {
    $playCursor.show();
  });
  player.on("stop", function () {
    $playCursor.hide();
  });
  player.on("playing", function (t) {
    var x = Math.round(t*ctx.sampleRate*player.get("zoom"));
    $playCursor.css("left", x+"px");
  });

  /*
  QaudioXHR(ctx, "musics/circus.mp3")
    .then(function (audioBuffer) {
      return createTrackFromAudioBuffer(audioBuffer, ctx);
    })
    .then(function (track) {
      player.tracks.add(track);
    })
    .done();
  */

    var buffer;

  $("input[type='file']").change(function() {
    QaudioFileInput(ctx, this).then(function(buf) {
      buffer = buf;
      return createTrackFromAudioBuffer(buf);
    })
    .then(function (track) {
      player.tracks.add(track);
    });
  });

  player.on("change:zoom", function (m, zoom) {
    player.tracks.each(function (track) {
      track.set("zoom", zoom);
    });
  });
  player.tracks.on("add", function (track) {
      track.set("zoom", player.get("zoom"));
  });



  var zoom;
  var zoomMult = 1.5;
  player.set("zoom", zoom = 0.001);
  player.on("button-zoomin", function () {
    var z = zoom * zoomMult;
    if (z < 1) {
      this.set("zoom", zoom = z);
    }
  });

  player.on("button-zoomout", function () {
    var z = zoom / zoomMult;
    this.set("zoom", zoom = z);
  });


  var clipboard;

  player.on("button-copy", function () {
    var track = player.get("currentTrack");
    var start = track.getCursorStartTime();
    var end = track.getCursorEndTime();
    clipboard = track.copy(Math.round(start*ctx.sampleRate), Math.round(end*ctx.sampleRate));
  });

  player.on("button-cut", function () {
    var track = player.get("currentTrack");
    var start = track.getCursorStartTime();
    var end = track.getCursorEndTime();
    clipboard = track.cut(Math.round(start*ctx.sampleRate), Math.round(end*ctx.sampleRate));
  });

  player.on("button-paste", function () {
    if (clipboard) {
      var track = player.get("currentTrack");
      var start = track.getCursorStartTime();
      var data = clipboard.copy(ctx);
      track.insert(data, Math.round(start*ctx.sampleRate));
    }
  });
  
  player.on("button-play", function () {
    var track = player.get("currentTrack");
    if (!track) {
      player.play();
    }
    else {
      var mode = track.get("cursormode");
      var start = track.getCursorStartTime();
      var end = track.getCursorEndTime();
      if (mode === "cursor") {
        player.play(start);
      }
      else {
        player.play(start, end);
      }
    }
  });

  player.on("button-stop", function () {
    player.stop();
  });

  player.on("button-download", function () {
    var audioBuffer = player.tracks.head().toAudioBuffer();
    var numberOfChannels = audioBuffer.numberOfChannels;
    var channels = [];
    for (var i=0; i<numberOfChannels; ++i) {
      channels.push(audioBuffer.getChannelData(i));
    }
    var view = Encoder.encodeWAV(channels);

    var blob = new Blob ( [ view ], { type : 'audio/wav' } );

    var url = URL.createObjectURL(blob);
    var hf = document.createElement('a');
    hf.href = url;
    hf.download = new Date().toISOString() + '.wav';
    hf.innerHTML = hf.download;

    //$(hf).appendTo("#wrapper");

    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    hf.dispatchEvent(click);
  });

  $record.addClass("disabled");
  $stopRecord.hide();
  eventuallyMicrophone.then(function(mic) {
    $record.removeClass("disabled");
    var record = null;
    var recordOut = ctx.createGain();
    recordOut.connect(ctx.destination);
    $record.click(function() {
        $stopRecord.show();
        // tracks management
        var track = null;

        // get array buffer from stream
        record = Zampling.createRecorderNode(ctx, function (buffer) {
          if(!track) {
            track = createTrackFromAudioBuffer(buffer);
            player.tracks.add(track);
          }
          else {
            track.append(new audioChunker.ChunkNode(new audioChunker.Chunk(buffer), null));
          }
        });
        record.connect(recordOut);
        mic.connect(record);
    });
    $stopRecord.click(function() {
      $(this).hide();
      mic.disconnect(record);
      record.disconnect(recordOut);
    });
  });


}());

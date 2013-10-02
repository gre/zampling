// polyfill
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

(function () {

  var $tracks = $("#tracks");

  var ctx = new (window.webkitAudioContext || window.AudioContext)();

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
      return Zampling.Track.createFromArrayBuffer(audioBuffer.getChannelData(0), ctx);
    })
    .then(function (track) {
      player.tracks.add(track);
    });
  */

    var buffer;

  $("input[type='file']").change(function() {
    QaudioFileInput(ctx, this).then(function(buf) {
      buffer = buf;
      return Zampling.Track.createFromArrayBuffer(buf.getChannelData(0), ctx)
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

  var zooms = [0.0001, 0.001, 0.005, 0.01, 0.05, 0.5];
  var currentZoomIndex = 0;
  player.set("zoom", zooms[currentZoomIndex]);

  player.on("button-zoomin", function () {
    if (currentZoomIndex < zooms.length-1) {
      currentZoomIndex ++;
      this.set("zoom", zooms[currentZoomIndex]);
    }
  });

  player.on("button-zoomout", function () {
    if (currentZoomIndex > 0) {
      currentZoomIndex --;
      this.set("zoom", zooms[currentZoomIndex]);
    }
  });

  var cutData;

  player.on("button-cut", function () {
    var track = player.get("currentTrack");
    var start = track.getCursorStartTime();
    var end = track.getCursorEndTime();
    cutData = track.cut(Math.round(start*ctx.sampleRate), Math.round(end*ctx.sampleRate));
  });

  player.on("button-paste", function () {
    var track = player.get("currentTrack");
    var start = track.getCursorStartTime();
    track.insert(cutData, Math.round(start*ctx.sampleRate));
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
    //var view = Encoder.encodeWAV([buffer.getChannelData(0), buffer.getChannelData(1)]);

    // TODO handle multiple tracks
    var view = Encoder.encodeWAV([player.tracks.head().toFloat32Array()])

    var blob = new Blob ( [ view ], { type : 'audio/wav' } );

    var url = URL.createObjectURL(blob);
    var hf = document.createElement('a');
    hf.href = url;
    hf.download = new Date().toISOString() + '.wav';
    hf.innerHTML = hf.download;

    $(hf).appendTo("#wrapper");

    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    hf.dispatchEvent(click);
  })

  var mediaStream = null;
  var mic = null;
  var record = null;
  $("button#record").click(function() {
    var eventuallyMediaStream = (function(d) {
      navigator.getUserMedia({ audio: true }, d.resolve, d.reject);
      return d.promise;
    } (Q.defer()));

    eventuallyMediaStream.then(function(stream) {
      mediaStream = stream
      $("button#stopRecord").show()
      var compressor = ctx.createDynamicsCompressor();
      compressor.connect(ctx.destination)

      var gain = ctx.createGain()
      gain.gain.value = 10
      gain.connect(compressor)

      // tracks management
      var track = null;

      // get array buffer from stream
      record = recorder(function(e) {
        if(!track) {
          track = Zampling.Track.createFromArrayBuffer(e.array, ctx);
          player.tracks.add(track);
        }
        else {
          var node = new Zampling.ChunkNode(new Zampling.Chunk(e.array, e.buffer));
          track.insert(node, track.length());
        }
      });
      record.connect(gain);

      mic = ctx.createMediaStreamSource(stream)
      mic.connect(record)
    })
  })

  // http://typedarray.org/from-microphone-to-wav-with-getusermedia-and-web-audio/
  function recorder(processingHandler) {
    var bufferSize = 2048;
    var processor = ctx.createJavaScriptNode(bufferSize, 1, 1);
    processor.onaudioprocess = function(e) {
      processingHandler({
        buffer: e.inputBuffer,
        array: new Float32Array(e.inputBuffer.getChannelData(0))
      });
    }

    return processor;
  }

  $("button#stopRecord").hide().click(function() {
    mediaStream.stop();
    mediaStream = null;
    mic.disconnect(0);
    record.disconnect(0);
    $(this).hide()
  })
}());

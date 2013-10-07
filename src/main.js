// polyfill
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

(function () {
  var $record = $("#record");
  var $stopRecord = $("#stopRecord");
  var $tracks = $("#tracks");

  var ctx = new (window.webkitAudioContext || window.AudioContext)();

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
      return Zampling.Track.createFromAudioBuffer(buf, ctx)
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
            track = Zampling.Track.createFromAudioBuffer(buffer, ctx);
            player.tracks.add(track);
          }
          else {
            track.append(new Zampling.ChunkNode(new Zampling.Chunk(buffer), null));
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

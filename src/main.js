// polyfill
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

(function () {

  var ctx = new (window.webkitAudioContext || window.AudioContext)();

  var player = new Zampling.Player();

  var $tracks = $("#tracks");

  player.tracks.on("add", function (track) {
    console.log("new track ", track);
    var trackView = new Zampling.TrackView({
      model: track
    });
    trackView.$el.appendTo($tracks);
  });

  QaudioXHR(ctx, "musics/circus.mp3")
    .then(function (audioBuffer) {
      return Zampling.Track.createFromArrayBuffer(audioBuffer.getChannelData(0), ctx);
    })
    .then(function (track) {
      player.tracks.add(track);
    });

    var buffer;

  $("input[type='file']").change(function() {
    QaudioFileInput(ctx, this).then(function(buf) {
      buffer = buf;
      return Zampling.Track.createFromArrayBuffer(buf.getChannelData(0), ctx)
    })
    .then(function (track) {
      player.tracks.add(track);
    });
  })

  $("div#controls").show()
  $("button#play").click(function() {
    player.play();
  })
  $("button#stop").click(function() {
    player.stop();
  })

  $("button#export").click(function() {
    //var view = Encoder.encodeWAV([buffer.getChannelData(0), buffer.getChannelData(1)]);

    var view = Encoder.encodeWAV([T.toFloat32Array()])

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

      record = recorder(function(e) {
        var sum = 0;
        for(var i = 0; i < e.buffer.length; i++) {
          sum = sum + e.buffer[i];
        }
        console.log("processing " + (sum / e.buffer.length));
      })
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
      processingHandler({ buffer: new Float32Array(e.inputBuffer.getChannelData(0)) });
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

  P = player;
}());

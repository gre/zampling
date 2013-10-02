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
    var view = Encoder.encodeWAV([buffer.getChannelData(0), buffer.getChannelData(1)]);

    var blob = new Blob ( [ view ], { type : 'audio/wav' } );

    var url = URL.createObjectURL(blob);
    var hf = document.createElement('a');
    hf.href = url;
    hf.download = new Date().toISOString() + '.wav';
    hf.innerHTML = hf.download;

    $(hf).appendTo("#wrapper")
  })

  P = player;
}());

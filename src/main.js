(function () {

  var ctx = new (window.webkitAudioContext || window.AudioContext)();

  var track = QaudioXHR(ctx, "musics/circus.mp3").then(Zampling.Track.createFromArrayBuffer);

  track.then(function(t){
    T = t;
  });

  var buffer = null

  $("input[type='file']").change(function() {
    QaudioFileInput(ctx, this).then(function(buf) {
      buffer = buf
      Zampling.Track.createFromArrayBuffer(buf)
    }).then(function() {
      $("div#controls").show()
    })
  })

  var player = new Zampling.Player()

  $("button#play").click(function() {
    player.play(buffer, player.offset())
  })
  $("button#stop").click(function() {
    player.stop()
  })
}());

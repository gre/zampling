(function () {

  var ctx = new (window.webkitAudioContext || window.AudioContext)();

  var track = QaudioXHR(ctx, "musics/circus.mp3").then(Zampling.Track.createFromArrayBuffer);

  track.then(function(t){
    T = t;
  });

  $("input[type='file']").change(function() {
    QaudioFileInput(ctx, this).then(function(buf) {
      Zampling.Track.createFromArrayBuffer(buf)
    })
  })
}());

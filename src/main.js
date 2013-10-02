(function () {

  var ctx = new (window.webkitAudioContext || window.AudioContext)();

  var track = QaudioXHR(ctx, "musics/circus.mp3").then(function (audioBuffer) {
    return Zampling.Track.createFromArrayBuffer(audioBuffer.getChannelData(0), ctx);
  });

  $("input[type='file']").change(function() {
    QaudioFileInput(ctx, this).then(function(buf) {
      Zampling.Track.createFromArrayBuffer(buf)
    })
  });

  track.then(function(t){
    T = t;
  }).done();
}());

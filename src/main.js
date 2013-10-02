(function () {

  var ctx = new (window.webkitAudioContext || window.AudioContext)();

  var track = QaudioXHR(ctx, "musics/circus.mp3").then(function (audioBuffer) {
    return Zampling.Track.createFromArrayBuffer(audioBuffer.getChannelData(0), ctx);
  });

  var buffer = null

  $("input[type='file']").change(function() {
    QaudioFileInput(ctx, this).then(function(buf) {
      buffer = buf
      $("div#controls").show()
      return Zampling.Track.createFromArrayBuffer(buf.getChannelData(0), ctx)
    }).then(function(t) {
      T = t
    })
  })

  var player = new Zampling.Player()

  $("button#play").click(function() {
    player.play(T)
  })
  $("button#stop").click(function() {
    player.stop()
  })

  $("button#export").click(function() {
    var view = Encoder.encodeWAV([buffer.getChannelData(0), buffer.getChannelData(1)]);

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

  track.then(function(t){
    T = t;
  }).done();
}());

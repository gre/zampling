
Zampling.createRecorderNode = function (ctx, giveBuffer, bufferSize, numberOfChannels) {
  if (!bufferSize) bufferSize = 4096;
  if (!numberOfChannels) numberOfChannels = 2;
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

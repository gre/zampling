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
function QaudioXHR (ctx, url) {
  var d = Q.defer();
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    ctx.decodeAudioData(request.response, d.resolve, d.reject);
  };
  request.onerror = d.reject;
  request.send();
  return d.promise;
}

function QaudioFileInput (context, fileInput) {
  var d = Q.defer();
  var reader = new FileReader();
  reader.onload = function(e) {
    context.decodeAudioData(this.result, d.resolve, d.reject);
  };
  reader.onerror = d.reject;
  reader.readAsArrayBuffer(fileInput.files[0]);
  return d.promise;
}



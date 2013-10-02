Zampling.Track = Backbone.Model.extend({
  initialize: function (opts) {
  },
  cut: function (from, to) {
    throw "Not Implemented";
  },
  insert: function (chunks, at) {
    throw "Not Implemented";
  },
  copy: function (from, to) { // returns chunks
    throw "Not Implemented";
  }
}, {
  createFromArrayBuffer: function (arrayBuffer) {
    // TODO cut in multiple chunks
    var chunks = new Zampling.ChunkNode(new Zampling.Chunk(arrayBuffer), null);
    return new Zampling.Track({
      chunks: chunks
    });
  }
});

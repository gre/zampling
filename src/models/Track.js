Zampling.Track = Backbone.Model.extend({
  initialize: function () {
    // this.chunks : Zampling.Chunk
  },
  remove: function (from, to) {
    throw "Not Implemented";
  },
  insert: function (chunks, at) {
    throw "Not Implemented";
  },
  copy: function (from, to) { // returns chunks
    throw "Not Implemented";
  }
}, {
  createFromArrayBuffer: function () {
    throw "Not Implemented";
  }
});


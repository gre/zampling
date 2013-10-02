Zampling.Chunk = Backbone.Model.extend({
  initialize: function () {

  },
  getNext: function () {
    return this.next;
  },
  setNext: function (chunk) {
    this.next = chunk;
  }
}, {
  getChunksFromArrayBuffer: function (buffer) {
    throw "Not Implemented";
  }
});

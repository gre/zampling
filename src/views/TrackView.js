Zampling.TrackView = Backbone.View.extend({
  className: "track",
  initialize: function (opts) {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.$cursor = $('<div class="cursor" hidden></div>');
    this.$selection = $('<div class="selection" hidden></div>');
    this.syncSize();
    this.model.listenTo(this, "change:width change:height", this.syncSize);
    this.render();

    this.$el.append(this.canvas);
    this.$el.append(this.$cursor);
    this.$el.append(this.$selection);
  },
  events: {
    "mousedown": "onMouseDown",
    "mouseup": "onMouseUp",
    "mousemove": "onMouseMove"
  },
  onMouseDown: function (e) {
    console.log("start");
  },
  onMouseUp: function (e) {
    console.log("stop");
  },
  onMouseMove: function (e) {
    console.log("move");
  },
  syncSize: function () {
    var W = this.model.get("width");
    var H = this.model.get("height");
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = dpr * W;
    this.canvas.height = dpr * H;
    this.canvas.style.width = W+"px";
    this.canvas.style.height = H+"px";
  },
  render: function () {
    var ctx = this.ctx;
    var W = ctx.canvas.width;
    var H = ctx.canvas.height;
    var zoom = this.model.get("zoom");
    var samplesPerZoom = Math.floor(1 / zoom);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#05f";
    var from = 0;
    if (zoom < 1) {
      for (var x = 0; x < W; ++x) {
        var stat = this.model.getStat(from, from+samplesPerZoom);
        var yStart = H * (1 - (stat.max + 1)/2);
        var yStop = H * (1 - (stat.min + 1)/2);
        ctx.fillRect(x, yStart, 1, yStop-yStart);
        from += samplesPerZoom;
      }
    }
    else {
      // TODO: other viz mode!
      throw "zoom level >= 1, Not Implemented";
    }
  }
});

Zampling.TrackView = Backbone.View.extend({
  className: "track",
  initialize: function (opts) {
    this.MIN_DELTA = 8;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.$cursor = $('<div class="cursor"></div>');
    this.$selection = $('<div class="selection"></div>');
    this.listenTo(this.model, "change:width change:height", this.syncSize);
    this.listenTo(this.model, "change:zoom change:samples", this.render);
    this.listenTo(this.model, "change:cursorstartx change:cursorendx", this.syncCursor);
    this.listenTo(this.model, "change:cursormode", this.syncCursorMode);

    this.$el.append(this.canvas);
    this.$el.append(this.$cursor);
    this.$el.append(this.$selection);

    this.syncSize();
  },
  events: {
    "mousedown": "onMouseDown",
    "mouseup": "onMouseUp",
    "mousemove": "onMouseMove"
  },
  onMouseDown: function (e) {
    e.preventDefault();
    var x = e.clientX - this.canvas.getBoundingClientRect().left;
    this.model.set({
      "cursormode": "cursor",
      "cursorstartx": x,
      "cursorendx": null,
      "moving": true
    });
  },
  onMouseUp: function (e) {
    var x = e.clientX - this.canvas.getBoundingClientRect().left;
    this.model.set({
      "cursorendx": x,
      "moving": false
    });
  },
  onMouseMove: function (e) {
    if (!this.model.get("moving")) return;
    var x = e.clientX - this.canvas.getBoundingClientRect().left;
    this.model.set("cursorendx", x);
  },
  syncCursorMode: function () {
    var mode = this.model.get("cursormode");
    if (mode == "cursor") {
      this.$cursor.show();
      this.$selection.hide();
    }
    else if (mode == "selection") {
      this.$selection.show();
      this.$cursor.hide();
    }
  },
  syncCursor: function () {
    var startx = this.model.get("cursorstartx");
    var endx = this.model.get("cursorendx");
    console.log(startx, endx);
    if (Math.abs(startx-endx) < this.MIN_DELTA) {
      this.model.set("cursormode", "cursor");
      this.$cursor.css({
        left: Math.round(startx)+"px"
      });
    }
    else {
      this.model.set("cursormode", "selection");
      this.$selection.css({
        left: Math.round(startx)+"px",
        width: Math.round(endx-startx)+"px"
      });
    }
  },
  syncSize: function () {
    var W = this.model.get("width");
    var H = this.model.get("height");
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = dpr * W;
    this.canvas.height = dpr * H;
    this.canvas.style.width = W+"px";
    this.canvas.style.height = H+"px";
    this.render();
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

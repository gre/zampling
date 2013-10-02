Zampling.ControlsView = Backbone.View.extend({
  initialize: function () {
    this.$play = $('<button class="play">Play</button>');
    this.$stop = $('<button class="stop">Stop</button>');
    this.$export = $('<button class="download">Download</button>');
    this.$zoomin = $('<button class="zoomin">+</button>');
    this.$zoomout = $('<button class="zoomout">-</button>');

    this.$el.append(this.$play);
    this.$el.append(this.$stop);
    this.$el.append(this.$export);
    this.$el.append(this.$zoomin);
    this.$el.append(this.$zoomout);
  },
  events: {
    "click .play": "onPlay",
    "click .stop": "onStop",
    "click .download": "onDownload",
    "click .zoomin": "onZoomIn",
    "click .zoomout": "onZoomOut"
  },
  onPlay: function () {
    this.model.trigger("button-play");
  },
  onStop: function () {
    this.model.trigger("button-stop");
  },
  onDownload: function () {
    this.model.trigger("button-download");
  },
  onZoomIn: function () {
    this.model.trigger("button-zoomin");
  },
  onZoomOut: function () {
    this.model.trigger("button-zoomout");
  }
});

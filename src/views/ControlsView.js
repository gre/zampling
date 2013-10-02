Zampling.ControlsView = Backbone.View.extend({
  initialize: function () {

    this.$div = $('<div class="blue ui buttons" style="margin:10px"></div>');
    this.$play = $('<div class="ui icon button play"><i class="play icon"></i></div>');
    this.$stop = $('<div class="ui icon button stop"><i class="stop icon"></i></div>');
    this.$export = $('<div class="ui right labeled icon button download green"><i class="right download disk icon"></i>Download</div>');
    this.$zoomin = $('<div class="zoomin ui icon button"><i class="zoom in icon"></i></div>');
    this.$zoomDiv = $('<div class="blue ui buttons" style="margin:10px"></div>');
    this.$zoomout = $('<div class="zoomout ui icon button"><i class="zoom out icon"></i></div>');

    this.$div.append(this.$play);
    this.$div.append(this.$stop);
    this.$el.append(this.$div);
    this.$el.append(this.$export);
    this.$zoomDiv.append(this.$zoomin);
    this.$zoomDiv.append(this.$zoomout);
    this.$el.append(this.$zoomDiv);
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

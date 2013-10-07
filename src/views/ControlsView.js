Zampling.ControlsView = Backbone.View.extend({
  initialize: function () {

    this.$div = $('<div class="blue ui buttons" style="margin:10px"></div>');
    this.$play = $('<div class="ui icon button action-play"><i class="play icon"></i></div>');
    this.$stop = $('<div class="ui icon button action-stop"><i class="stop icon"></i></div>');
    this.$export = $('<div class="ui right labeled icon button action-download green"><i class="right download disk icon"></i>Download</div>');
    this.$zoomin = $('<div class="action-zoomin ui icon button"><i class="zoom in icon"></i></div>');
    this.$zoomDiv = $('<div class="blue ui buttons" style="margin:10px"></div>');
    this.$zoomout = $('<div class="action-zoomout ui icon button"><i class="zoom out icon"></i></div>');

    this.$opDiv = $('<div class="blue ui buttons" style="margin:10px"></div>');
    this.$copy = $('<div class="action-copy ui icon button"><i class="copy icon"></i></div>');
    this.$cut = $('<div class="action-cut ui icon button"><i class="cut icon"></i></div>');
    this.$paste = $('<div class="action-paste ui icon button"><i class="paste icon"></i></div>');

    this.$div.append(this.$play);
    this.$div.append(this.$stop);
    this.$el.append(this.$div);
    this.$el.append(this.$export);
    this.$zoomDiv.append(this.$zoomin);
    this.$zoomDiv.append(this.$zoomout);
    this.$el.append(this.$zoomDiv);
    this.$opDiv.append(this.$cut);
    this.$opDiv.append(this.$copy);
    this.$opDiv.append(this.$paste);
    this.$el.append(this.$opDiv);
  },
  events: {
    "click .action-play": "onPlay",
    "click .action-stop": "onStop",
    "click .action-download": "onDownload",
    "click .action-zoomin": "onZoomIn",
    "click .action-zoomout": "onZoomOut",
    "click .action-copy": "onCopy",
    "click .action-cut": "onCut",
    "click .action-paste": "onPaste"
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
  },
  onCopy: function () {
    this.model.trigger("button-copy");
  },
  onCut: function () {
    this.model.trigger("button-cut");
  },
  onPaste: function () {
    this.model.trigger("button-paste");
  }
  
});

Zampling.ControlsView = Backbone.View.extend({
  initialize: function () {
    this.$play = $('<button class="play">Play</button>');
    this.$stop = $('<button class="stop">Stop</button>');
    this.$export = $('<button class="download">Download</button>');

    this.$el.append(this.$play);
    this.$el.append(this.$stop);
    this.$el.append(this.$export);
  },
  events: {
    "click .play": "onPlay",
    "click .stop": "onStop",
    "click .download": "onRecord"
  },
  onPlay: function () {
    this.model.trigger("button-play");
  },
  onStop: function () {
    this.model.trigger("button-stop");
  },
  onRecord: function () {
    this.model.trigger("button-record");
  }
});

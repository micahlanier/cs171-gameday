/**
 * Constructor for games visualization object.
 */
GamesVis = function(_parent_element, _game_data, _event_handler) {
  // Primary settings.

  // Visual settings.
  this.width = 1140;
  this.height = 50;

  // Process inputs.
  this.parent_element = _parent_element;
  this.game_data = _game_data;
  this.event_handler = _event_handler;

  // Initialize the visualization automatically on creation.
  this.init_visualization();
};

/**
 *
 */
GamesVis.prototype.init_visualization = function() {
  var that = this;

  //// Visual elements initialization.

  // Append new SVG.
  this.svg = this.parent_element.append('svg')
      .attr({
          height: this.height,
          width:  this.width
      });

};

/**
 *
 */
GamesVis.prototype.on_team_change = function() {
  var that = this;
};

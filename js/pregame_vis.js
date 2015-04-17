/**
 * Constructor for postgame visualization object.
 */
PregameVis = function(_parent_element, _context, _pregame_data) {
  var that = this;

  //// Primary settings.

  //// Execution.

  // Process inputs.
  this.parent_element = _parent_element;
  this.pregame_data = _pregame_data;
  this.context = _context;

  //// Visual setup.

  // Initialize the visualization automatically on creation.
  this.init_visualization();
};

/**
 *
 */
PregameVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  // Note team change.
  this.team = _new_team;
};

/**
 *
 */
PregameVis.prototype.init_visualization = function() {
  var that = this;

}
/**
 * Constructor for postgame visualization object.
 */
PostgameVis = function(_parent_element, _context, _postgame_data) {
  var that = this;

  //// Primary settings.

  //// Execution.

  // Process inputs.
  this.parent_element = _parent_element;
  this.postgame_data = _postgame_data;
  this.context = _context;

  //// Visual setup.

  // Initialize the visualization automatically on creation.
  this.init_visualization();
};

/**
 *
 */
PostgameVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  // Note team change.
  this.team = _new_team;
};

/**
 *
 */
PostgameVis.prototype.init_visualization = function() {
  var that = this;

}
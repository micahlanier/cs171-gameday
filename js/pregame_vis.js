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
PregameVis.prototype.init_visualization = function() {
  var that = this;

  // For testing purposes, add a status box.
  this.parent_element.append('span');
};

/**
 *
 */
PregameVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  // Note team change.
  this.team = _new_team;

  // Print team status.
  this.parent_element.select('span').text('Status box for testing. Selected '+this.team+'.');
};

/**
 *
 */
PregameVis.prototype.on_game_selection_change = function(_game_ids) {
  var that = this;

  this.parent_element.select('span').text('Status box for testing. Selected '+_game_ids.length+' games.');
};
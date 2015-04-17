/**
 * Constructor for postgame visualization object.
 */
PregameVis = function(_parent_element, _pregame_data) {

};

/**
 *
 */
PregameVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  // Note team change.
  this.team = _new_team;
};

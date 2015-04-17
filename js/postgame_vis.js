/**
 * Constructor for postgame visualization object.
 */
PostgameVis = function(_parent_element, _postgame_data) {

};

/**
 *
 */
PostgameVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  // Note team change.
  this.team = _new_team;
};

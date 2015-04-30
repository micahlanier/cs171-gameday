/**
 * Constructor for postgame visualization object.
 */
PregameLineVis = function(_parent_element, _context, _pregame_data) {
  var that = this;

  //// Primary settings.

  // Core visual settings.
  this.width  = 550;
  this.height = 350;

  // Margins.
  this.margin = {
    top: 20,
    right: 10,
    bottom: 30,
    left: 50
  };

  // Bar padding.
  this.bar_padding = .1;
  this.bar_outer_padding = .1;

  // Useful objects.
  // Here's a formal listing of lines, and a titled version.
  this.lines = ['blue','green','orange','red'];
  // this.line_names = {};
  // for (var l=0; l < this.lines.length; l++)
  //   this.line_names[this.lines[l]] = this.lines[l].charAt(0).toUpperCase() + this.lines[l].slice(1);

  //// Execution.

  // Process inputs.
  this.parent_element = _parent_element;
  this.pregame_line_data   = this.preprocess_data(_pregame_data);
  this.context        = _context;

  // Placeholders for later settings.
  this.game_ids, this.game_count, this.display_data, this.lift_extent;

  //// Visual setup.

  // Scales for x and y axis.
  this.scales = {
    // Line scale.
    lines: d3.scale.ordinal().domain(this.lines).rangeBands([this.margin.left,this.width-this.margin.right], this.bar_padding, this.bar_outer_padding),
    // Entry lift scale.
    lift:  d3.scale.linear().domain([0,10000]).range([this.height-this.margin.bottom, this.margin.top])
  };

  // Axes.
  this.axes = {
    // Lines axis.
    lines: d3.svg.axis().scale(this.scales.lines).orient('bottom'),
    // Entry lift axis.
    lift:  d3.svg.axis().scale(this.scales.lift).orient('left') // .tickFormat(d3.format('.1s'))
  };

  //// Visual setup.

  // Initialize the visualization automatically on creation.
  this.init_visualization();
};

/**
 *
 */
PregameLineVis.prototype.preprocess_data = function(pregame_data) {
  // Object to store data. For easy access to specific games, use an object for starters. We'll convert to a list later.
  var pregame_data_processed = {};

  // Traverse all pregame teams, records.
  for (var team in pregame_data) {
    // Set up object for team.
    pregame_data_processed[team] = {};
    // Get game data.
    var games = pregame_data[team];
    // Traverse all games.
    for (var g = 0; g < games.length; g++) {
      // Get datum, game ID; add to object if not already there.
      var datum = games[g];
      var game_id = parseInt(datum['game_id']);
      if ((game_id in pregame_data_processed[team]) == false) {
        pregame_data_processed[team][game_id] = { game_id: game_id };
        for (var l=0; l < this.lines.length; l++)
          pregame_data_processed[team][game_id][this.lines[l]] = 0;
      }
      // Update records for each line.
      for (var l=0; l < this.lines.length; l++)
        pregame_data_processed[team][game_id][this.lines[l]] += parseFloat(datum['lift_entries_'+this.lines[l]]);
    }
  }

  // List data container. Outer level is still teams, so that remains an object.
  var pregame_data_list = {};

  // Traverse data and convert.
  for (var team in pregame_data_processed) {
    // Set up array for team.
    pregame_data_list[team] = [];
    // Get game data.
    var games = pregame_data_processed[team];
    // Traverse all games.
    for (var game_id in games) {
      pregame_data_list[team].push(games[game_id]);
    }
  }

  // Return the list form.
  return pregame_data_list;
};

/**
 *
 */
PregameLineVis.prototype.init_visualization = function() {
  var that = this;

  //// Visual elements initialization.

  // Append new SVG.
  this.svg = this.parent_element.append('svg')
      .attr({
          id:     'pregame_line_vis',
          height: this.height,
          width:  this.width
      });

  // Append axes.
  this.axis_groups = {
    /*lines:  this.svg.append('g')
              .attr({
                'id':'pregame_line_axis_lines',
                'transform': 'translate('+0+','+(this.height-this.margin.bottom)+')'
              })
              .classed('axis y_axis',true)
              .call(this.axes.lines),*/
    lift:   this.svg.append('g')
              .attr({
                'id':'pregame_line_axis_lift',
                'transform': 'translate('+this.margin.left+',0)'
              })
              .classed('axis x_axis',true)
              .call(this.axes.lift)
  };

  // Append axis labels.
  this.axis_labels = this.svg.append('g').classed('axis_labels',true);
  this.axis_labels.append('text')
    .attr({
      'transform': 'translate(0,'+(this.margin.top+(this.height-this.margin.top-this.margin.bottom)/2)+')rotate(-90)',
      'class':     'y_axis_label'
    })
    .text('Mean Entry Lift');

  // Append line for 0 point on vertical axis. It will be updated repeatedly depending on lift info.
  this.zero_lift_line = this.svg.append('line')
    .attr({
      'x1': this.margin.left,
      'x2': this.width-this.margin.right,
      'class': 'zero_lift'
    });

  // Append group for lift bars.
  this.lift_bars_group = this.svg.append('g').attr('class','lift_bars');
};

/**
 *
 */
PregameLineVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  // Note team change.
  this.team = _new_team;

  // Get all game IDs and use them for game selection.
  // This will have the effect of showing the aggregate for all days.
  var game_ids = this.pregame_line_data[this.team].map(function (d) { return d.game_id; });
  this.on_game_selection_change(game_ids);
};

/**
 *
 */
PregameLineVis.prototype.on_game_selection_change = function(_game_ids) {
  var that = this;
  
  // Note new game IDs.
  this.game_ids = _game_ids;
  this.game_count = this.game_ids.length;

  // Set up data object.
  this.wrangle_data();

  // Update visualization.
  this.update_visualization();
};

/**
 *
 */
PregameLineVis.prototype.wrangle_data = function() {
  var that = this;
  
  // Empty display dataset and information about lift extent.
  this.display_data = [];
  this.lift_extent  = [0,0];

  // Aggregate data in a dictionary first.
  var line_data = {};
  // Pre-fill with zeros.
  for (var l=0; l < this.lines.length; l++)
    line_data[this.lines[l]] = 0;
  
  // Traverse data and aggregate by line.
  

};

/**
 *
 */
PregameLineVis.prototype.update_visualization = function() {
  var that = this;

  //// Vertical Scale & Axis

  // TODO

  //// Bars
  
  // TODO
};

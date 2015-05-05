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
  this.bar_padding = .5;
  this.bar_outer_padding = .5;

  // Useful objects.
  // Here's a formal listing of lines, and a titled version.
  this.lines = ['blue','green','orange','red'];
  // this.line_names = {};
  // for (var l=0; l < this.lines.length; l++)
  //   this.line_names[this.lines[l]] = this.lines[l].charAt(0).toUpperCase() + this.lines[l].slice(1);

  //// Execution.

  // Process inputs.
  this.parent_element = _parent_element;
  this.pregame_line_data = this.preprocess_data(_pregame_data);
  this.context = _context;

  // Placeholders for later settings.
  this.game_ids, this.game_count, this.display_data, this.lift_extent;

  //// Visual setup.

  // Scales for x and y axis.
  this.scales = {
    // Line scale.
    lines: d3.scale.ordinal().domain(this.lines).rangeRoundBands([this.margin.left,this.width-this.margin.right], this.bar_padding, this.bar_outer_padding),
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

  // Formatter for bar labels.
  this.lift_label_format = d3.format('+,.0f');

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
      var game_id = datum['game_id'];
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
      'x2': this.width-this.margin.right-this.margin.left,
      'class': 'zero_lift'
    });

  // Append group for lift bars and labels.
  this.lift_bars_group = this.svg.append('g').attr('class','lift_bars');
  this.lift_labels_group = this.svg.append('g').attr('class','lift_labels');
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

  // Aggregate data in a dictionary first.
  var line_data = {};
  // Pre-fill with zeros.
  for (var l=0; l < this.lines.length; l++)
    line_data[this.lines[l]] = 0;
  
  // Traverse data and aggregate by line.
  for (var g=0; g < this.pregame_line_data[this.team].length; g++) {
    // Get game.
    var game = this.pregame_line_data[this.team][g];
    // Only process if game is in list.
    if (this.game_ids.indexOf(game.game_id) != -1) {
      // Traverse lines and add lift.
      for (var l=0; l < this.lines.length; l++)
        line_data[this.lines[l]] += game[this.lines[l]];
    }
  }
  
  // Convert to list. Empty display dataset first.
  this.display_data = [];
  // Calculate means while we're at it. Sums are nice and all, but not very useful.
  for (line in line_data)
    this.display_data.push({
      'line': line,
      'mean_lift': line_data[line] / this.game_ids.length
    });

  // Sort.
  this.display_data.sort(function (a,b) { return a.mean_lift > b.mean_lift; });

  // Calculate lift extents.
  this.lift_extent = d3.extent(this.display_data.map(function (d) { return d.mean_lift; }));
  // Ensure anchor at 0.
  if (this.lift_extent[0] * this.lift_extent[1] > 0)
    if (this.lift_extent[0] > 0)
      this.lift_extent[0] = 0;
    else
      this.lift_extent[1] = 0;

  // Update scale domains based on magnitude and order for each line.
  // Lift scale reflects lift extent.
  this.scales.lift.domain(this.lift_extent);
  // Lines scale reflects ordering.
  this.scales.lines.domain(this.display_data.map(function (d) { return d.line; }));
};

/**
 *
 */
PregameLineVis.prototype.update_visualization = function() {
  var that = this;

  //// Vertical Scale & Axis

  // Get range of lifts and update scale, axis.
  this.axes.lift.scale(this.scales.lift);
  this.axis_groups.lift
    .transition().duration(200)
    .call(this.axes.lift);

  //// Zero Lift Indicator

  var zero_lift_line_y = this.scales.lift(0);
  this.zero_lift_line
    .transition().duration(200)
    .attr({
      'y1': zero_lift_line_y, 'y2': zero_lift_line_y
    });

  //// Bars & Labels
  
  // Bind rectangles and text.
  this.vis_bars = this.lift_bars_group.selectAll('rect')
    .data(this.display_data, function (d) { return d.line; });
  this.vis_labels = this.lift_labels_group.selectAll('text')
    .data(this.display_data, function (d) { return d.line; });

  // Enter selection. Just control initial styling. Line colors conveniently work as CSS colors. Win!
  this.vis_bars.enter().append('rect')
    .attr({
      'class': 'vis_bar',
      'width': this.scales.lines.rangeBand()
    })
    .style('fill',function (d) { return d.line; });
  this.vis_labels.enter().append('text')
    .style('fill',function (d) { return d.line});

  // Update selection. Change positions, labels, etc.
  this.vis_bars
    .transition().duration(200)
    .attr({
      'x': function (d) { return that.scales.lines(d.line); },
      'y': function (d) { return (d.mean_lift > 0) ? that.scales.lift(d.mean_lift) : that.scales.lift(0); },
      'height': function (d) {
        if (d.mean_lift > 0)
          return that.scales.lift(0)-that.scales.lift(d.mean_lift);
        else
          return that.scales.lift(d.mean_lift)-that.scales.lift(0);
      },
    });
  this.vis_labels
    .classed('positive', function (d) { return d.mean_lift >= 0; })
    .classed('negative', function (d) { return d.mean_lift <  0; })
    .transition().duration(200)
    .attr({
      'x': function (d) { return that.scales.lines(d.line)+that.scales.lines.rangeBand()/2; },
      'y': function (d) { return that.scales.lift(d.mean_lift) + ((d.mean_lift >= 0) ? -5 : 12); }
    })
    .text(function (d) { return that.lift_label_format(d.mean_lift); });
};

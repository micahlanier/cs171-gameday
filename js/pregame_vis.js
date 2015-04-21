/**
 * Constructor for postgame visualization object.
 */
PregameVis = function(_parent_element, _context, _pregame_data) {
  var that = this;

  //// Primary settings.

  // Core visual settings.
  this.width  = 500;
  this.height = 400;

  // Margins.
  this.margin = {
    top: 20,
    right: 30,
    bottom: 30,
    left: 50
  };

  //// Execution.

  // Process inputs.
  this.parent_element = _parent_element;
  this.pregame_data   = _pregame_data;
  this.context        = _context;

  // Placeholders for later settings.
  this.game_ids, this.game_count, this.display_data, this.lift_extent;

  // Set up info for data processing.
  this.lift_col_prefix = 'lift_entries_';
  this.hour_increments = d3.range(-.5,6.25,.25);
  this.hour_to_index = function (h) { return 4*h+2   };
  this.index_to_hour = function (i) { return (i-2)/4 };

  //// Visual setup.

  // Scales for x and y axis.
  this.scales = {
    // Time scale. Can have fixed inputs and outputs (will not vary with selection).
    hours: d3.scale.linear().domain([-.5,6]).range([this.width-this.margin.left-this.margin.right, this.margin.left]),
    // Entry lift scale.
    lift:  d3.scale.linear().domain([0,10000]).range([this.height-this.margin.bottom, this.margin.top])
  };

  // Axes.
  this.axes = {
    // Time axis.
    hours: d3.svg.axis().scale(this.scales.hours).tickValues([-.5,0,1,2,3,4,5,6]).orient('bottom'),
    // Entry lift axis.
    lift:  d3.svg.axis().scale(this.scales.lift).orient('left') // .tickFormat(d3.format('.1s'))
  };

  // Lines handler.
  this.lines = d3.svg.line()
    .x(function (d,i) { return that.scales.hours(that.index_to_hour(i)) })
    .y(function (d,i) { return that.scales.lift(d) })
    .interpolate('basis');

  //// Visual setup.

  // Initialize the visualization automatically on creation.
  this.init_visualization();
};

/**
 *
 */
PregameVis.prototype.init_visualization = function() {
  var that = this;

  //// Visual elements initialization.

  // Append new SVG.
  this.svg = this.parent_element.append('svg')
      .attr({
          id:     'pregame_vis',
          height: this.height,
          width:  this.width
      });

  // Append axes.
  this.axis_groups = {
    hours:  this.svg.append('g')
              .attr({
                'id':'pregame_axis_hours',
                'transform': 'translate('+0+','+(this.height-this.margin.bottom)+')'
              })
              .classed('axis y_axis',true)
              .call(this.axes.hours),
    lift:   this.svg.append('g')
              .attr({
                'id':'pregame_axis_lift',
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
    .text('Entry Lift');
  this.axis_labels.append('text')
    .attr({
      'transform': 'translate('+(this.margin.left+(this.width-this.margin.left-this.margin.right)/2)+','+this.height+')',
      'class':     'x_axis_label'
    })
    .text('Hours Until Game Start');

  // Append line for game start.
  this.svg.append('line')
    .attr({
      'x1': this.scales.hours(0),
      'x2': this.scales.hours(0),
      'y1': this.margin.top,
      'y2': this.height-this.margin.bottom,
      'class': 'game_start'
    });

  // Append line for 0 point on vertical axis. It will be updated repeatedly depending on lift info.
  this.zero_lift_line = this.svg.append('line')
    .attr({
      'x1': this.scales.hours(6),
      'x2': this.scales.hours(-.5),
      'class': 'zero_lift'
    });

  // Append group for lift lines.
  this.lift_lines_group = this.svg.append('g').attr('class','lift_lines');
};

/**
 *
 */
PregameVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  // Note team change.
  this.team = _new_team;

  // Get all game IDs and use them for game selection.
  // This will have the effect of showing the aggregate for all days.
  var game_ids = d3.set(this.pregame_data[this.team].map(function (d) { return d.game_id; })).values();
  this.on_game_selection_change(game_ids);
};

/**
 *
 */
PregameVis.prototype.on_game_selection_change = function(_game_ids) {
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
PregameVis.prototype.wrangle_data = function() {
  var that = this;
  
  // Empty display dataset and information about lift extent.
  this.display_data = [];
  this.lift_extent  = [0,0];
  
  // Traverse lines and data to calculate mean lift.
  for (var l = 0; l < this.context.lines.length; l++) {
    // Get line, col.
    var line = this.context.lines[l];
    var line_col = this.lift_col_prefix + line;
    // Container for line data.
    var line_lift = d3.range(this.hour_increments.length).map(function(){return 0});
    // Traverse data and update.
    for (var i = 0; i < this.pregame_data[this.team].length; i++) {
      // Get observation.
      var datum = this.pregame_data[this.team][i];
      if (this.game_ids.indexOf(datum['game_id']) > -1) {
        // Transform hours value to index.
        var datum_hour_index = this.hour_to_index(datum['hours_until_game_start'])
        // Add to total and calculate average all at once.
        line_lift[datum_hour_index] += parseFloat(datum[line_col] / this.game_ids.length);
        // Update extents.
        this.lift_extent[0] = Math.min(this.lift_extent[0],line_lift[datum_hour_index]);
        this.lift_extent[1] = Math.max(this.lift_extent[1],line_lift[datum_hour_index]);
      }
    }
    // Append to display data.
    this.display_data.push({ 'line': line, 'lift': line_lift });
  }
};

/**
 *
 */
PregameVis.prototype.update_visualization = function() {
  var that = this;

  //// Vertical Scale & Axis

  // Get range of lifts and update scale, axis.
  this.scales.lift.domain(this.lift_extent);
  this.axes.lift.scale(this.scales.lift);
  this.axis_groups.lift
    // .transition().duration(500)
    .call(this.axes.lift);

  //// Zero Lift Indicator
  var zero_lift_line_y = this.scales.lift(0);
  this.zero_lift_line
    // .transition().duration(500)
    .style('opacity',function (d) { return (that.lift_extent[0] < 0 && that.lift_extent[1] > 0) ? 1 : 0 })
    .attr({
      'y1': zero_lift_line_y, 'y2': zero_lift_line_y
    })

  //// Lines
  
  // Bind paths.
  this.vis_lines = this.lift_lines_group.selectAll('path').data(this.display_data, function (d) { return d.line; });

  // Enter selection. Just control initial styling. Line colors conveniently work as CSS colors. Win!
  this.vis_lines.enter().append('path').attr('class','vis_line').style('stroke',function (d) { return d.line; });

  // Update selection. Change values!
  this.vis_lines
    // .transition().duration(500)
    .attr('d', function (d) { return that.lines(d.lift); });

  // Exit selection. Define it just in case but it will not likely be used.
  this.vis_lines.exit().remove();
};

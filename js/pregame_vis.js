/**
 * Constructor for postgame visualization object.
 */
PregameVis = function(_parent_element, _context, _pregame_data) {
  var that = this;

  //// Primary settings.

  // Core visual settings.
  this.width  = 500;
  this.height = 300;

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
  this.pregame_data = _pregame_data;
  this.context = _context;

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
    lift:  d3.svg.axis().scale(this.scales.lift).tickFormat(d3.format('.1s')).orient('left')
  };

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
PregameVis.prototype.on_game_selection_change = function(_game_ids) {
  var that = this;
};
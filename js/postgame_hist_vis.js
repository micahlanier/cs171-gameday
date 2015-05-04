/**
 * Constructor for postgame visualization object.
 */
PostGameHistVis = function(_parent_element, _context, _postgame_data) {
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

  // Process inputs.
  this.parent_element = _parent_element;
  this.postgame_game_data = this.preprocess_data(_postgame_data);
  this.context = _context;

  // Placeholders for later settings.
  this.game_ids, this.game_count, this.display_data, this.lift_extent;

  //// Visual setup.
  // Scales for x and y axis.
  this.scales = {
    // Line scale.
    meanlift: d3.scale.linear().domain([400,-20]).range([this.width-this.margin.left-this.margin.right, this.margin.left]),
    // Entry lift scale.
    liftfreq:  d3.scale.linear().domain([0,2000]).range([this.height-this.margin.bottom, this.margin.top])
  };

  // Axes.
  this.axes = {
    // meanlift axis.
    meanlift: d3.svg.axis().scale(this.scales.meanlift).orient('bottom'),
    // Entry lift axis.
    liftfreq:  d3.svg.axis().scale(this.scales.liftfreq).orient('left') 
  };

  // Formatter for bar labels.
  this.lift_label_format = d3.format(',.0f');
  
  //histogram settings
  this.datpergame= 27;
  this.binNumber = 50;
  
  //// Visual setup.
  // Initialize the visualization automatically on creation.
  this.init_visualization();
};

/**
 *
 */
PostGameHistVis.prototype.preprocess_data = function(postgame_data) {

  // Object to store data. For easy access to specific games, use an object for starters. We'll convert to a list later.
  var postgame_data_processed = {};

  // Traverse all postgame teams, records.
  for (var team in postgame_data) {
    // Set up object for team.
    postgame_data_processed[team] = {};
    // Get game data.
    var games = postgame_data[team];
    // Traverse all games.
    for (var g = 0; g < games.length; g++) {
      // Get datum, game ID; add to object if not already there.
      var datum = games[g];
      var game_id = datum['game_id'];
      if ((game_id in postgame_data_processed[team]) == false) {
        postgame_data_processed[team][game_id] = { game_id: game_id };
          postgame_data_processed[team][game_id] = 0;
      }

      postgame_data_processed[team][game_id] += parseFloat(datum['entry_lift'] );
    }
  }


  // List data container. Outer level is still teams, so that remains an object.
  var postgame_data_list = {};

  // Traverse data and convert.
  for (var team in postgame_data_processed) {
    // Set up array for team.
    postgame_data_list[team] = [];
    // Get game data.
    var games = postgame_data_processed[team];
    // Traverse all games.
    for (var game_id in games) {
      postgame_data_list[team].push([game_id,games[game_id] / 27]);
    }
  }


  // Return the list form.
  return postgame_data_list;
};


/**
 *
 */
PostGameHistVis.prototype.init_visualization = function() {
  var that = this;

  //// Visual elements initialization.

  // Append new SVG.
  this.svg = this.parent_element.append('svg')
      .attr({
          id:     'postgame_hist_vis',
          height: this.height,
          width:  this.width
      });

  // Append axes.
  this.axis_groups = {
    meanlift:  this.svg.append('g')
              .attr({
                'id':'postgame_hist_axis_meanlift',
                'transform': 'translate('+0+','+(this.height-this.margin.bottom)+')'
              })
              .classed('axis y_axis',true)
              .call(this.axes.meanlift),
    liftfreq:   this.svg.append('g')
              .attr({
                'id':'postgame_hist_axis_liftfreq',
                'transform': 'translate('+this.margin.left+',0)'
              })
              .classed('axis x_axis',true)
              .call(this.axes.liftfreq)
  };

  // Append axis labels.
  this.axis_labels = this.svg.append('g').classed('axis_labels',true);
  this.axis_labels.append('text')
    .attr({
      'transform': 'translate(0,'+(this.margin.top+(this.height-this.margin.top-this.margin.bottom)/2)+')rotate(-90)',
      'class':     'y_axis_label'
    })
    .text('Frequency');
    this.axis_labels.append('text')
    .attr({
      'transform': 'translate('+(this.margin.left+(this.width-this.margin.left-this.margin.right)/2)+','+this.height+')',
      'class':     'x_axis_label'
    })
    .text('Mean Entry Lift');


  // Append group for lift bars and labels.
  this.lift_bars_group = this.svg.append('g').attr('class','lift_bars');
  this.lift_labels_group = this.svg.append('g').attr('class','lift_labels');
};

/**
 *
 */
PostGameHistVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  // Note team change.
  this.team = _new_team;

  // Get all game IDs and use them for game selection.
  // This will have the effect of showing the aggregate for all days.
 
  var game_ids = this.postgame_game_data[this.team].map(function (d) { return d[0]; });

  this.on_game_selection_change(game_ids);
};

/**
 *
 */
PostGameHistVis.prototype.on_game_selection_change = function(_game_ids) {
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
PostGameHistVis.prototype.wrangle_data = function() {
  var that = this;

  // Empty display dataset and information about lift extent.
  this.display_data = [];
  this.lift_extent  = [0,0];
  
  // Traverse data to calculate mean lift.

  var line_lift = []; //d3.range(this.hour_increments.length).map(function(){return 0});

  // Traverse data and update.
  for (var i = 0; i < this.postgame_game_data[this.team].length; i++) {
    // Get observation.

    var datum = this.postgame_game_data[this.team][i];

    if (this.game_ids.indexOf(datum[0]) > -1) {
      // Add to total
       line_lift.push(parseFloat(datum[1]));
    }
  }
  // Append to display data
  this.display_data.push({ 'line': 'purple', 'lift': line_lift });
};

/**
 *
 */
PostGameHistVis.prototype.update_visualization = function() {
  var that = this;

  //// Vertical Scale & Axis

  //calculate bin width
  var range = this.scales.meanlift.range();
  this.binWidth = Math.abs( range[0]-range[1])/this.binNumber;
  //Generate a histogram using twenty uniformly-spaced bins.
  this.data = d3.layout.histogram()
    .bins(this.scales.meanlift.ticks(this.binNumber))
    (this.display_data[0].lift);
   
  //update lift extent
  this.scales.liftfreq.domain(d3.extent(this.data.map(function (d) { return d.y; })));
  // Get range of lifts and update scale, axis.
  this.axes.liftfreq.scale(this.scales.liftfreq);
  this.axis_groups.liftfreq
    .transition().duration(200)
    .call(this.axes.liftfreq);


  //// Bars & Labels
  
  // Bind rectangles and text.
  this.vis_bars = this.lift_bars_group.selectAll('rect')
    .data(this.data);

  this.vis_labels = this.lift_labels_group.selectAll('text')
    .data(this.data);

  // Enter selection. Just control initial styling. Line colors conveniently work as CSS colors. Win!
  this.vis_bars.enter().append('rect')
    .attr({
      'class': 'vis_bar',
      'width': that.binWidth
    })
    .style('fill',function (d) { return 'purple' });

  this.vis_labels.enter().append('text')
    .style('fill',function (d) { return 'purple'});



  // Update selection. Change positions, labels, etc.
  this.vis_bars
    .transition().duration(200)
    .attr({
      'x': function (d) { return that.scales.meanlift(d.x); },
      'y': function (d) { return that.scales.liftfreq(d.y) },
      'height': function (d) {
        return that.scales.liftfreq(0)-that.scales.liftfreq(d.y);  
      },
    });
  this.vis_labels
    .classed('positive', function (d) { return d.y > 0; })
    .classed('negative', function (d) { return d.y <=  0; })
    .transition().duration(200)
    .attr({
      'x': function (d) { return that.scales.meanlift(d.x) + that.binWidth/2 ; },
      'y': function (d) { return that.scales.liftfreq(d.y) + ((d.y >= 0) ? -5 : 12); }

    })
    .text(function (d) { return that.lift_label_format(d.y); });

    

};

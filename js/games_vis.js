/**
 * Constructor for games visualization object.
 */
GamesVis = function(_parent_element, _context, _event_handler, _games) {
  var that = this;

  //// Primary settings.

  // Visual settings.
  this.width = 1140;
  this.height = 60;

  // Timeline settings.
  this.timeline_height = this.height-20;

  // Margins for games and seasons.
  this.season_margin = 10;
  this.timeline_margin = { 'top': 10, 'bottom': 10 }

  //// Execution.

  // Process inputs.
  this.parent_element = _parent_element;
  this.games = _games;
  this.event_handler = _event_handler;
  this.context = _context;

  // Scales.
  this.scales = {
    'time': d3.scale.linear().range([this.timeline_margin.top, this.timeline_height-this.timeline_margin.bottom]),
    'x': d3.scale.linear().range([0,this.width])
  };

  // Brush.
  this.brush = d3.svg.brush()
    .on('brush', function() {
      that.brushed();
    });

  // Placeholders for later settings.
  this.team;

  //// Preprocessing

  // There are a few things that we want to set up for each team so that we do not need to calculate them on the fly later.
  this.preprocess_data()

  //// Visual setup.

  // Initialize the visualization automatically on creation.
  this.init_visualization();
};

/**
 *
 */
GamesVis.prototype.preprocess_data = function() {
  // Team- and season-specific objects that we are going to fill.
  this.seasons = {};
  this.team_info = {};

  // Store information about all teams.
  for (var t = 0; t < this.context.teams.length; t++) {
    // Get current working team.
    var team = this.context.teams[t];

    // Start with team info.
    this.team_info[team] = {};
    this.team_info[team]['time_range'] = d3.extent(this.games[team], function(d) { return parseInt(d.hour)+d.minute/60; } );

    // We're done storing team info; start on seasons.
    // Season info containers.
    this.seasons[team] = [];
    var season_info = {};

    // Set up information about each season.
    var seasons = d3.set(this.games[team].map(function (d) { return d.season} )).values();
    for (var s = 0; s < seasons.length; s++)
      season_info[seasons[s]] = { 'season': seasons[s], 'games': 0, 'offset': undefined }

    // Traverse games and get game counts.
    for (var g = 0; g < this.games[team].length; g++) 
      season_info[this.games[team][g].season]['games'] += 1;

    // Traverse season games and calculate offsets, widths, spans, scales.
    var running_game_count = 0;
    for (var s = 0; s < seasons.length; s++) {
      // Store current season.
      season = seasons[s];
      // Store offset.
      season_info[season]['offset'] = running_game_count / this.games[team].length;
      // Store width.
      season_info[season]['width'] = season_info[season]['games'] / this.games[team].length;
      // Date range.
      season_info[season]['date_range'] = d3.extent(this.games[team].filter(function (d) { return d.season == season; }), function(d) { return new Date(d.date); } );
      season_info[season]['day_length'] = (season_info[season]['date_range'][1]-season_info[season]['date_range'][0]) / (1000*60*60*24);
      season_info[season]['scale'] = d3.time.scale().domain(season_info[season]['date_range'])
        .range([this.width*season_info[season]['offset']+this.season_margin, this.width*(season_info[season]['offset']+season_info[season]['width'])-this.season_margin]);
      // Add to running sum of games.
      running_game_count += season_info[season]['games'];
    }

    // Traverse games once more and store timeline position.
    for (var g = 0; g < this.games[team].length; g++) 
      this.games[team][g]['timeline_x'] = season_info[this.games[team][g].season]['scale'](new Date(this.games[team][g].date));

    // Dictionary representation is nice, but arrays will work better for binding.
    // Convert and store.
    for (var s = 0; s < seasons.length; s++)
      this.seasons[team].push(season_info[seasons[s]]);
  }
};

/**
 *
 */
GamesVis.prototype.init_visualization = function() {
  var that = this;

  //// Visual elements initialization.

  // Append new SVG.
  this.svg = this.parent_element.append('svg')
      .attr({
          id:     'games_vis',
          height: this.height,
          width:  this.width
      });

  // Append background group.
  this.svg_bg = this.svg.append('g').attr('id','games_timeline_bg');

  // Add background rectangle.
  this.svg_bg.append('rect')
      .attr({
          height: this.timeline_height,
          width:  this.width
      });

  // Brush group.
  this.svg_brush = this.svg.append('g').classed('brush', true);

  // Append groups for game and season separators.
  this.svg_game_markers = this.svg_bg.append('g').attr('id','game_markers');
  this.svg_season_markers = this.svg_bg.append('g').attr('id','season_markers');
};

/**
 *
 */
GamesVis.prototype.on_team_change = function(_new_team) {
  var that = this;

  //// Setup.

  // Note team change.
  this.team = _new_team;

  // Update time scale.
  this.scales.time.domain(this.team_info[this.team]['time_range']);

  //// Season markers.

  // Group bind.
  var season_markers = this.svg_season_markers.selectAll('g').data(this.seasons[this.team], function (d) { return d.season; });
  // Group enter.
  var season_markers_new = season_markers.enter().append('g').classed('season_marker_group',true)
    .style('opacity',0)
    .attr('transform',function (d) { return 'translate('+d.offset*that.width+',0)'; });

  // Line bind.
  var season_marker_lines = season_markers.selectAll('line').data(function (d) { return [d]; });
  // Line enter.
  season_marker_lines.enter().append('line')
    .attr({
      'x1': -1,
      'x2': -1,
      'y1': 0,
      'y2': that.height
    });

  // Text bind.
  var season_marker_text = season_markers.selectAll('text').data(function (d) { return [d]; });
  // Text enter.
  season_marker_text.enter().append('text')
    .attr({
      'transform': 'translate('+3+','+(1 + this.timeline_height + (this.height-this.timeline_height)/2)+')'
    });
  // Text update.
  season_marker_text
    .text(function (d) { return d.season + ' Season'; });

  // Group update.
  season_markers.transition()
    .style('opacity',1)
    .attr('transform',function (d) { return 'translate('+d.offset*that.width+',0)'; });

  // Exit selection.
  season_markers.exit().transition().duration(500)
    .style('opacity',0)
    .remove();

  //// Game markers.

  // Bind circles.
  var game_points = this.svg_game_markers.selectAll('circle').data(this.games[this.team]);

  // Circle enter.
  game_points.enter().append('circle')
    .style('opacity',0)
    .attr({
      'r': 2,
      'fill': this.context.team_colors[this.team]
    });

  // Cicle update.
  game_points
    .transition()
    .style('opacity',1)
    .attr({
      'cx': function (d) { return d.timeline_x; },
      'cy': function (d) { return that.scales.time(parseInt(d.hour)+d.minute/60); },
      'fill': this.context.team_colors[this.team]
    });

  // Circle exit.
  game_points.exit().remove();

  //// Brush.

  // Configure brush.
  this.brush.x(this.scales.x);
  this.svg_brush
      .call(this.brush)
      .attr('width', this.width)
      .selectAll('rect')
        .attr('height', this.timeline_height);
};

/**
 *
 */
GamesVis.prototype.brushed = function() {
  // Do stuff here with this.brush.extent() and this.brush.empty().
  // Will eventually trigger the event handler for a selection change.
}
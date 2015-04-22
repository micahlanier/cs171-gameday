/* This script defines the main execution code for index.html. */

// Run the following on load.
$(function() {
  var that = this;

  // Main data variables. Each map will have an entry for each team.
  var game_data     = {};
  var pregame_data  = {};
  var postgame_data = {};

  // Simple team list for reference.
  this.teams = ['bruins','celtics','sox'];
  this.team_names = {
    'bruins':  'Bruins',
    'celtics': 'Celtics',
    'sox':     'Red Sox'
  };
  this.team_colors = {
    'bruins':  '#FDB930',
    'celtics': '#008348',
    'sox':     '#BD3039'
  };
  this.game_durations = {
    'bruins':  2.3,
    'celtics': 1,
    'sox':     3
  };

  // Lines list for reference.
  this.lines = ['blue','green','orange','red'];

  var init_visualization = function() {
    //// Initialization

    // Create an event handler.
    var event_handler = new Object();

    // Instantiate all vis objects.
    var games_vis    = new GamesVis(d3.select('#vis_games'),       that, event_handler, game_data);
    var pregame_vis  = new PregameVis(d3.select('#vis_pregame'),   that, pregame_data);
    var postgame_vis = new PostgameVis(d3.select('#vis_postgame'), that, postgame_data);

    // Instantiate related objects.
    var special_filter_controller = new SpecialFilterController(d3.select('#special_filter_container'), that, event_handler);

    //// Event Handler Setup

    // Handle team toggling events.
    $(event_handler).bind('team_changed', function(event, team_name) {
      // UI updates.
      $('#games_title span').text('Boston '+that.team_names[team_name]+' Games')
      // Vis object updates.
      games_vis.on_team_change(team_name);
      pregame_vis.on_team_change(team_name);
      postgame_vis.on_team_change(team_name);
      // Other updates.
      special_filter_controller.on_team_change(team_name);
    });

    // Handle cases where selection changed by filter function.
    $(event_handler).bind('apply_game_selection_filter', function(event, game_filter, source) {
      // Vis object updates.
      games_vis.on_game_selection_filter_application(game_filter, source);
      // Other UI updates.
      special_filter_controller.on_game_selection_filter_application(source);
    });

    // Handle brush events.
    $(event_handler).bind('game_selection_changed', function(event, game_ids) {
      // Vis object updates.
      games_vis.highlight_games(game_ids);
      pregame_vis.on_game_selection_change(game_ids);
      postgame_vis.on_game_selection_change(game_ids);
    });

    //// Triggers

    // Bind team changes to UI buttons.
    $('.team_button').change(function() {
      // Unhide UI.
      $('#visualization_container').css('display','block');
      // Trigger change event.
      $(event_handler).trigger('team_changed', this.id);
    })

    //// Miscellanea

    // Set up tooltips.
    $('[data-toggle="tooltip"]').tooltip({'placement':'top'});
  }

  var data_loaded = function(error, _game_bruins, _game_celtics, _game_sox, _pregame_bruins, _pregame_celtics, _pregame_sox, _postgame_bruins, _postgame_celtics, _postgame_sox) {
    // Bind datasets. This is verbose because all have to be hard-coded.
    game_data['bruins'] = _game_bruins;
    game_data['celtics'] = _game_celtics;
    game_data['sox'] = _game_sox;
    pregame_data['bruins'] = _pregame_bruins;
    pregame_data['celtics'] = _pregame_celtics;
    pregame_data['sox'] = _pregame_sox;
    postgame_data['bruins'] = _postgame_bruins;
    postgame_data['celtics'] = _postgame_celtics;
    postgame_data['sox'] = _postgame_sox;

    // Initialize the visualization itself.
    init_visualization();
  }

  // Initialization function. Starts by retrieving data and calls load handler upon completion.
  var init_page = function() {
    // Use asynchronous queue to load data.
    queue()
      .defer(d3.csv, 'data/bruins.csv')
      .defer(d3.csv, 'data/celtics.csv')
      .defer(d3.csv, 'data/sox.csv')
      .defer(d3.csv, 'data/bruins_pregame.csv')
      .defer(d3.csv, 'data/celtics_pregame.csv')
      .defer(d3.csv, 'data/sox_pregame.csv')
      .defer(d3.csv, 'data/bruins_postgame.csv')
      .defer(d3.csv, 'data/celtics_postgame.csv')
      .defer(d3.csv, 'data/sox_postgame.csv')
      .await(data_loaded);
  }

  // Start by initializing the visualization.
  init_page();
});

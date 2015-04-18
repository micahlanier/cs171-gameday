/**
 * Constructor for special filters object.
 */
SpecialFilterController = function(_parent_element, _context, _event_handler) {
  // Process inputs.
  this.parent_element = _parent_element;
  this.event_handler  = _event_handler;
  this.context        = _context;

  // Initialize actual buttons.
  this.init_filter_buttons();
};

/**
 *
 */
SpecialFilterController.prototype.init_filter_buttons = function() {
  // Traverse each team, storing its button class and creating buttons for each of its ordered filters.
  for (var t = 0; t < this.context.teams.length; t++) {
    var that = this;

    // Get team, info.
    var team = this.context.teams[t];
    var btn_class = this.filters[team].btn_class;

    // Append span for the team.
    var team_span = this.parent_element.append('span')
        .attr({
          'id': 'special_filters_'+team,
          'class': 'hidden filter_button_group'
        });

    // Traverse filters.
    var filters = this.filters.general.concat(this.filters[team].filters);
    // Create buttons.
    var buttons = team_span.selectAll('button').data(filters).enter().append('button')
        .attr({
          'class': 'btn btn-'+btn_class,
          'type':  'button',
          'id':    function (d,i) { return 'special_filter_button-'+team+'-'+i }
        })
        .text(function (d) { return d.name; })
        .on('click',function (d) {
          // Update button states.
          $('span.filter_button_group button').toggleClass('active',false);
          $(this).toggleClass('active', true);
          // Apply filter.
          $(that.event_handler).trigger('apply_game_selection_filter', [d.filter_function, 'special_filter_button']);
        });
  }
};

/**
 *
 */
SpecialFilterController.prototype.on_team_change = function(_new_team) {
  // Update selected team.
  this.team = _new_team;

  // Hide all buttons for starters.
  this.parent_element.selectAll('span.filter_button_group')
    .classed('hidden',true);
  // Now unhide the correct group.
  this.parent_element.select('span#special_filters_'+this.team)
    .classed('hidden',false);

  // Unselect all buttons.
  $('span.filter_button_group button').toggleClass('active',false);
};

/**
 *
 */
SpecialFilterController.prototype.on_game_selection_filter_application = function(source) {
  if (source != 'special_filter_button')
    $('span.filter_button_group button').toggleClass('active',false);
};

/**
 * The following objects are special filters for each team.
 * init_filter_buttons() will create them as buttons and bind the correct functions to each.
 */
SpecialFilterController.prototype.filters = {
  general: [
    {
      name: 'Weekends',
      filter_function: function (d) { return d.day_of_week >= 5; }
    },
    {
      name: 'Weekdays',
      filter_function: function (d) { return d.day_of_week <= 4; }
    },
    {
      name: 'Early',
      filter_function: function (d) { return d.late == 0; }
    },
    {
      name: 'Late',
      filter_function: function (d) { return d.late == 1; }
    },
    {
      name: 'Playoffs',
      filter_function: function (d) { return d.playoff == 1; }
    }
  ],
  bruins: {
    'btn_class': 'warning',
    'filters': [
      {
        name: 'Montreal',
        filter_function: function (d) { return d.opponent == 'Montreal'; }
      }
    ]
  },
  celtics: {
    'btn_class': 'success',
    'filters': [
      {
        name: 'Lakers',
        filter_function: function (d) { return d.opponent == 'Los Angeles Lakers'; }
      }
    ]
  },
  sox: {
    'btn_class': 'danger',
    'filters': [
      {
        name: 'Yankees',
        filter_function: function (d) { return d.opponent == 'Yankees'; }
      }
    ]
  }
};
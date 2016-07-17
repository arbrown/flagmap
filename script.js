var width = 800,
    height = 600;

// set up Albers projection function
var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([400, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .style("width", width)
    .style("height", height)
    .attr("class", "flagmap");

var defs = svg.append('svg:defs');
svg.append("rect")
    .attr("fill", "transparent")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

d3.json("us.json", function(unitedState) {
  var data = topojson.feature(unitedState, unitedState.objects.states).features;
  d3.tsv("us-state-country-flags.tsv", function(tsv){
    var info = {};
    // map state id numbers to info about the state / country flag
    tsv.forEach(function(d,i){
      info[d.id] = {
        name: d.name, flag: d.flagimg,
        scalex: d.scalex, scaley: d.scaley,
        country: d.countryname, population: d.countrypopulation
      };
    });

    // draw the WHOLE map once, just to get the size of each state for
    // its flag background.  There's almost certainly a better way to do this ;)
    g.append("g")
      .attr("class", "states-bundle")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", path)
      .each(function(d,i){
        var flag = new Image();
        flag.src = "flags/" + info[d.id].flag;
        var statex = this.getBBox().width;
        var statey = this.getBBox().height;

        var dx = this.getBBox().x;
        var dy = this.getBBox().y;

        flag.onload = function(){
          var origflagx = this.width;
          var origflagy = this.height;

          var flagx= origflagx;
          var flagy = origflagy;

          // This is the result of several iterations of flag size (and postion)
          // scaling.  I really didn't want to do it custom for each flag, and
          // this seems like it does a reasonable job, provided I tell it how to
          // scale.  If I ever refactor, this would be a good spot to start.
          // I *should* figure out the aspect ratio of the bounding rectangle of
          // each state (or better yet, something based on center of mass so that
          // Alaska's Islands don't stretch its rectangle further than it reasonably
          // seems) and then do the right scaling/ translation based on that,
          // but I'm not quite sure how that would work yet...
          if (info[d.id].scalex != 0){
            flagx = origflagx * (statex/origflagx) * 1.1;
            flagy = origflagy * (statex/origflagx) * 1.1;
          }

          if (info[d.id].scaley != 0) {
            flagx = flagx * (statey/flagy);
            flagy = flagy * (statey/flagy);
            dx = dx - flagx/3;
          }

          // Create the 'pattern' for each state shape.
          defs.append("pattern")
            .attr("id", "flag"+ d.id)
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", flagx)
            .attr("height", flagy)
            .attr("patternTransform", "translate("+ dx + " " + dy + ")")
            .append("svg:image")
            .attr("xlink:href", "flags/"+info[d.id].flag)
            .attr("width", flagx)
            .attr("height", flagy)
            .attr("x", 0)
            .attr("y", 0);
          }
          // remove the invisible/fake state shapes.
          this.remove();
      });

      // draw the actual map
    g.append("g")
      .attr("class", "states-bundle")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("stroke", "gray")
      .attr("class", "states")
      .style("fill",function(d){ return "url(#flag" + d.id +")"; })
      // add an informative tooltip
      .on("mousemove", function(d) {
        var state = info[d.id];
        var html = "";
        html += "<table>";
        html += "<tr class = 'statename'><td>"+ state.name? state.name : "" + "</tr></td>";
        html += "<tr class = 'countryname'><td>";
        html += state.country ? state.country : "";
        html += "</td></tr>";
        html += "<tr><td>";
        html += "<div class='tooltipflag'><img src=flags/" + state.flag + "></div>";
        html += "</td></tr>";
        html += "<tr class='countrypopulation'><td>";
        html += "Population: " + new Number(state.population).toLocaleString();
        html += " </td></tr>";


        $("#tooltip-container").html(html);
        $(this).attr("fill-opacity", "0.8");
        $("#tooltip-container").show();

        var coordinates = d3.mouse(this);

        var map_width = svg.node().getBBox().width;

        if (d3.event.layerX < map_width / 2) {
          d3.select("#tooltip-container")
            .style("top", (d3.event.layerY + 15) + "px")
            .style("left", (d3.event.layerX + 15) + "px");
        } else {
          var tooltip_width = $("#tooltip-container").width();
          d3.select("#tooltip-container")
            .style("top", (d3.event.layerY + 15) + "px")
            .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
        }
    })
    .on("mouseout", function() {
            $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").hide();
        });
  });
});

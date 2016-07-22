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
  d3.tsv("us-state-names-country-area.tsv", function(tsv){
    var info = {};
    // map state id numbers to info about the state / country flag
    tsv.forEach(function(d,i){
      info[d.id] = {
        name: d.name, flag: d.flagimg,
        country: d.closestcountry, closestarea: d.closestarea,
        sqkm: d.sqkm, sqmi: d.sqmi
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
        if (info[d.id]){
          var flag = new Image();
          flag.src = "flags/" + info[d.id].flag;
          var statex = this.getBBox().width;
          var statey = this.getBBox().height;

          var dx = this.getBBox().x;
          var dy = this.getBBox().y;

          flag.onload = function(){

            // I like this new pattern-scaling algorithm much better.
            // Basically, it scales the flag so that it will *just* fill
            // in the state, then calculates an offset so that the flag is
            // horizontally (or in some cases vertically) centered in the state.
            // I still think this could be improved by calculating a 'center of
            // mass' for each state and then 'centering' the flag horizontally
            // and vertically along those axes, but that might require rescaling
            // the flag to be even larger, and would probably be far more
            // computationally expensive than it was worth for the benefit.
            var origflagx = this.width;
            var origflagy = this.height;

            var flagx= origflagx;
            var flagy = origflagy;

            flagx = flagx * (statey/flagy);
            flagy = flagy * (statey/flagy);

            // fix proportions for tall skinny states (or sometimes tall skinny flags!)
            if (flagx < statex){
              var oldflagx = flagx;
              flagx = flagx * (statex/flagx);
              flagy = flagy * (statex/oldflagx);
              dy = dy - (flagy-statey)/2;
            }
            else {
              dx = dx - (flagx-statex)/2;
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
          }
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
        html += "<tr class='statearea'><td>";
        html += "State Area: " + new Number(state.sqkm).toLocaleString() + " sq km";
        html += "</td></tr><tr classname='stateareami'><td>";
        html += "(" + new Number(state.sqmi).toLocaleString() + " sq mi)";
        html += " </td></tr>";
        html += "<tr class='countryarea'><td>";
        html += "Country Area: " + new Number(state.closestarea).toLocaleString();
        html += " sq km</td></tr>";


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

function randint2(scale){
  return Math.ceil(Math.random() * scale);
}

function review_color(score){
  var red = 255; var green = 255;
  var t = score / 2.5;
  if (t < 1){
    green = 255 * Math.pow(t, 0.5);
  } else {
    red = 255 * Math.pow(2-t, 0.5);   
  }
  r = "rgb("+ Math.floor(red) +","+ Math.floor(green)+","+ 0+")";
  return r;
}
// The fisheye function.
function fisheyemove () {
        fisheye.focus(d3.mouse(this));

      node.each(function(d) { d.fisheye = fisheye(d); })
        .attr("cx", function(d) { return d.fisheye.x; })
        .attr("cy", function(d) { return d.fisheye.y; })
        .attr("r", function(d) { return d.fisheye.z * (3+Math.log(d.helpful+1)); });

      link.attr("x1", function(d) { return d.source.fisheye.x; })
        .attr("y1", function(d) { return d.source.fisheye.y; })
        .attr("x2", function(d) { return d.target.fisheye.x; })
        .attr("y2", function(d) { return d.target.fisheye.y; });
  }
  
  
var width = 960,
    height = 800;

var nodeLocation= {};
var linkDependencies = [];
var default_stroke_opacity = 0.1;
var highlighted = null; 

var force = d3.layout.force()
    .size([width, height])
    .charge(-70)
    .linkDistance(function (l){
      var total = 0;
      l.weight.forEach(function(x){total += x});
      return 5 * (total/l.weight.length)/5;
    })
    .on("tick", tick);

var drag = force.drag()
    .on("dragstart", dragstart);

var fisheye = d3.fisheye.circular()
    .radius(100)
    .distortion(5);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

function main(filename){
d3.json(filename, function(error, graph) {
  if (error) throw error;
  //var nodeLocation = {};
  
  var n = graph.nodes.length;
  for (var i=0; i < n; i++) {
    linkDependencies[i] = [];
    for (var j=0; j < n; j++) {
      linkDependencies[i][j] = false;
    }
  }
  var temp = 0;
  graph.nodes.forEach(function(n){
    n["x"] = randint2(width);
    n["y"] = randint2(height);
    nodeLocation[n.name] = temp++;
  });
  console.log(graph.nodes[0]);

  graph.links.forEach(function(l) {
    l.source = nodeLocation[l.source];
    l.target = nodeLocation[l.target];
    linkDependencies[l.source][l.target] = true;
    linkDependencies[l.target][l.source] = true;
  });



  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();


  link = link.data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d){return d.weight.length;})
    .style("stroke-opacity", default_stroke_opacity);

  node = node.data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", function(d){return 3 + 1.5*Math.log(d.helpful+1);})
      .style("fill", function(d){
        var avg_score = d.scores / d.count;
        return review_color(avg_score);
      })
      .on('mouseover', function(d) { // Highlights the node underneath the mouse.
      if (graph.mouseoutTimeout) {
        clearTimeout(graph.mouseoutTimeout);
        graph.mouseoutTimeout = null;
      }
      highlightObject(d);
        })
        .on('mouseout', function() { // Removes the highlight of the node.
      if (graph.mouseoutTimeout) {
        clearTimeout(graph.mouseoutTimeout);
        graph.mouseoutTimeout = null;
        console.log('bye');
      }
      graph.mouseoutTimeout = setTimeout(function() {
        highlightObject(null);
        }, 300);
      })
      .on("dblclick", dblclick)
      .call(drag);
      svg.on('mousemove', null); 
});
}

function highlightObject(obj) {
    if (obj) {
      if (obj !== highlighted) {
        node.attr('fill-opacity', function(d) {
            // If the node is not the mouseover-ed node or link-dependent on that node.
          if (obj !== d
                  && !linkDependencies[nodeLocation[obj.name]][nodeLocation[d.name]]
                && !linkDependencies[nodeLocation[d.name]][nodeLocation[obj.name]]) {
            return (.1);
          }
          return 1; // If it is that node or connected to that node.
        });
        link.attr('stroke-opacity', function(d) {
          if (obj !== d.source && obj !== d.target) return (.1);
          return 1; 
        });
      }
      highlighted = obj;
    } else {
        // Remove any highlighted nodes.
      if (highlighted) {
        node.attr('fill-opacity', 1);
        link.attr('stroke-opacity', default_stroke_opacity);
      }
      highlighted = null;
    }
  }

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function dblclick(d) {
  d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
  d3.select(this).classed("fixed", d.fixed = true);
}

function start() {
  var selection1 = document.getElementById("select_file");
    var str = selection1.options[selection1.selectedIndex].text;
  svg.selectAll(".node").remove();
  svg.selectAll(".link").remove();
  if (str == '10000graph') {
        main('networks/10000graph.json');
  } else if (str == '100000graph') {
    main('networks/100000graph.json');
  } else if (str == '100000graphb') {
    main('networks/100000graphb.json');
  } else if (str == 'full graph') {
    main('networks/agraph1000.json');
  }
}

// For directed graph code from:
// https://bl.ocks.org/mbostock/4062045

// The mouseover feature was inspired by:
// https://github.com/nylen/d3-process-map

var highlighted = null;           // The current node highlighted.
var default_stroke_opacity = 0.2; // Default opacity for links.


// Set background to fisheye button to green.
document.getElementById('fisheye_btn').style.background="#FF0000";

// Size of svg window
var width = 1360,
    height = 660;

// Set available colors for nodes.
var color = d3.scale.category20();

// Set default values for the force layout.
var force = d3.layout.force()
    .charge(-70)
//    .linkDistance(10)
    .size([width, height]);
	
var drag = force.drag()
    .on("dragstart", dragstart);

// Set default values for the fisheye
var fisheye = d3.fisheye.circular()
    .radius(100)
    .distortion(5);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// Store the fisheye function to be toggled.
var fisheyemove = null;

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

function dblclick(d) {
  d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
  d3.select(this).classed("fixed", d.fixed = true);
}

// Sample graphs:
// random_networks/nodes111.json   random_networks/easy.json
// Real graph
// networks/agraph1000.json
function main (s) {
	
d3.json(s, function(error, graph) {
    if (error) throw error;

    var n = graph.nodes.length;
    console.log('number of nodes ' + n);
  
    var nodeLocation = new Array(n);
    var linkDependencies = [];
	var link_reviews = []; // 3-D array that stores all the reviews for a particular link.
	var link_weights = [];
    for (var i=0; i < n; i++) {
	    linkDependencies[i] = [];
		link_reviews[i] = [];
		link_weights[i] = [];
        for (var j=0; j < n; j++) {
		    linkDependencies[i][j] = false;
			link_weights[i][j] = [];
		}
    }


	// Store all the nodes in a usable format.
    var temp = 0;
    var nodeMap = {};
    graph.nodes.forEach(function(d) { nodeMap[d.name] = d; nodeLocation[d.name] = temp++; });

    graph.links.forEach(function(l) {
	    if (isNaN(l.source)) {
		    // if the source is a name rather than a number, assign a corresponding number.
			// This happens in the Amazon reviews data.
            l.source = nodeMap[l.source];
            l.target = nodeMap[l.target];
			var i1 = nodeLocation[l.source.name];
			var j1 = nodeLocation[l.target.name];
		    linkDependencies[i1][j1] = true;
		    linkDependencies[j1][i1] = true;
	    } else { // if (l.source is a number)
		    // This else statement was used in random graphs.
		    linkDependencies[l.source][l.target] = true;
		    linkDependencies[l.target][l.source] = true;
	    }
		//console.log('Link between ' + nodeLocation[l.target.name] + ' and ' + nodeLocation[l.source.name] + ' b0ss.');
    })
  
    force.nodes(graph.nodes).links(graph.links); // Create the force graph.
	
    //graph.nodes.forEach(function(d,i){ d.x = d.y = width / n * i; });
  
    //force.start();
    //for (var i=0; i < 0; i++) force.tick();
    //force.stop();
  
	  

    var link = svg.selectAll(".link")
        .data(graph.links)
      .enter().append("line")
        .attr("class", "link")
	    .attr("stroke-width", function (d) { return d.pid.length; })
	    .attr("stroke-opacity", default_stroke_opacity);
        //.style("stroke-width", function(d) { return Math.sqrt(d.weight); });



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
	
	force.linkDistance(function (l){
        var total = 0;
        l.weight.forEach(function(x){total += x});
        return 5 * (total/l.weight.length)/5;
    });
	
    var node = svg.selectAll(".node")
        .data(graph.nodes)
      .enter().append("circle")
        .attr("class", "node")
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
		// Randomly place the nodes.
		.attr("cx", function(d) { return Math.random() * width; })
		.attr("cy", function(d) { return Math.random() * height; })
		.attr("r", function(d) {return (3 + Math.log(d.helpful + 1));})
        .style("fill", function(d){
            var avg_score = d.scores / d.count;
            return review_color(avg_score);
        })
		.on("dblclick", dblclick)
        .call(drag);
	  
    node.append("title")
        .text(function(d) { return d.name; });

	// 'tick' function for force to set graph.
    force.on("tick", function() {
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
    });

	// The fisheye function.
	fisheyemove = function () {
        fisheye.focus(d3.mouse(this));

	    node.each(function(d) { d.fisheye = fisheye(d); })
		    .attr("cx", function(d) { return d.fisheye.x; })
		    .attr("cy", function(d) { return d.fisheye.y; })
		    .attr("r", function(d){return (d.fisheye.z * (3 + Math.log(d.helpful + 1)));}); // d.fisheye.z
			

	    link.attr("x1", function(d) { return d.source.fisheye.x; })
		    .attr("y1", function(d) { return d.source.fisheye.y; })
		    .attr("x2", function(d) { return d.target.fisheye.x; })
		    .attr("y2", function(d) { return d.target.fisheye.y; });
	}
	
    svg.on('mousemove', null); // Default off fisheye.
});

}
//var e = document.getElementById("ddlViewBy");
//var strUser = e.options[e.selectedIndex].value;
function start() {
	var selection1 = document.getElementById("select_file");
    var str = selection1.options[selection1.selectedIndex].text;
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

// This javascript file makes the fisheye able to toggle, as well as force ticking.


function fisheyeToggle() {
    if (fisheye_active) {
	    fisheye_active = false;		
		document.getElementById('fisheye_btn').style.background="#FF0000";
		svg.on("mousemove", null);
	} else {
	    fisheye_active = true;
		document.getElementById('fisheye_btn').style.background="#00FF00";
        svg.on("mousemove", fisheyemove);
	}
}

var toggle_force_on = false;

window.onkeyup = function(e) {
    var key = e.keyCode ? e.keyCode : e.which;
    console.log('Key:  ' + key);
	if (key == 70) {
        fisheyeToggle();
	} else if (key == 84) {
	    force.start();
	    force.tick();
		force.stop();
	} else if (key == 82) {
		if (toggle_force_on) {
			force.stop();
			toggle_force_on = false;
		} else {
			force.start();
			toggle_force_on = true;
		}
	}
}

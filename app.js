// Script File for Shopify Backend Intern Challenge - Summer 2018
// By Kabir Singh

var apiPromises = [];
var g = new graphlib.Graph({compound: true});
var children_index = 0;
var root_id = 0;
var child_cycle = false;
var ancestors = [];
var children = [];
var invalid_menus_array = [];
var valid_menus_array = [];
var sinks = [];
var jsonObj = {};

// Using fetch method to retreive information from the API
for (var i = 1; i <= 3; i++) {
	apiPromises.push(fetch('https://backend-challenge-summer-2018.herokuapp.com/challenges.json?id=1&page=' + i).then((resp) => resp.json()));
}

Promise.all(apiPromises)
.then(responses => {
	var proccessedResponses = [];
	responses.map(response => {
		proccessedResponses.push(response);
	});
	settingNodes(proccessedResponses);
});

// Declaring and initializing each node
// Setting the edges between the nodes
function settingNodes(obj) {
	for(var pg_count = 0; pg_count < 3; pg_count++) {
		for (var id_count = 0; id_count < obj[pg_count].menus.length; id_count++) {
			g.setNode(obj[pg_count].menus[id_count].id, obj[pg_count].menus[id_count].data);
			for(var child_ids_count = 0; child_ids_count < obj[pg_count].menus[id_count].child_ids.length; child_ids_count++) {
				g.setEdge(obj[pg_count].menus[id_count].child_ids[child_ids_count], obj[pg_count].menus[id_count].id);
			}
		}
	}

	var cycle_array = graphlib.alg.findCycles(g);
	var connected_comp = graphlib.alg.components(g);

	// Checking to see if there are cycles
	if(graphlib.alg.isAcyclic(g) == false) {
		var cycles = graphlib.alg.findCycles(g).length;
		for(var i = 0; i < cycles; i++) {
			var invalid_menus_obj = {};
			invalid_menus_obj.root_id = parseInt(g.successors(cycle_array[i][0]));
			for(var m = 0; m < cycle_array[i].length; m++) {
				cycle_array[i][m] = parseInt(cycle_array[i][m]);
			}
			cycle_array[i].sort(sortNumber);
			invalid_menus_obj.children = cycle_array[i];
			invalid_menus_array.push(invalid_menus_obj);
			var root_children = g.predecessors(g.successors(cycle_array[i][0]));
			if(root_children.length > 1) {
				for(var j = 0; j < root_children.length; j++) {
					var valid_menus_obj = {};
					for(var k = 0; k < cycle_array[i].length; k++) {
						if(root_children[j] == cycle_array[i][k]) {
							child_cycle = true;
						}
					}
					if(child_cycle == false) {
						valid_menus_obj.root_id = parseInt(g.successors(cycle_array[i][0]));
						ancestors = getAncestors(g, root_children[j]);
						ancestors.splice(0, 0, parseInt(root_children[i]));
						for(var m = 0; m < ancestors.length; m++) {
							ancestors[m] = parseInt(ancestors[m]);
						}
						ancestors.sort(sortNumber);
						valid_menus_obj.children = ancestors;
						valid_menus_array.push(valid_menus_obj);
					}
				}

			}
		}
		jsonObj.invalid_menus = invalid_menus_array;
	}

	sinks = g.sinks();

	// Getting the valid menus by looking at nodes that are sinks and getting the children of that certain node
	if(g.sinks().length > 0) {
		for(var i = 0; i < sinks.length; i++) {
			var valid_menus_obj = {};
			for(var j = 0; j < connected_comp.length; j++) {
				for(var k = 0; k < connected_comp[j].length; k++) {
					if(sinks[i] == connected_comp[j][k]) {
						connected_comp[j].splice(k, 1);
						children_index = j;
					}
				}
			}
			valid_menus_obj.root_id = parseInt(sinks[i]);
			for(var m = 0; m < connected_comp[children_index].length; m++) {
				connected_comp[children_index][m] = parseInt(connected_comp[children_index][m]);
			}
			connected_comp[children_index].sort(sortNumber);
			valid_menus_obj.children = connected_comp[children_index];
			valid_menus_array.push(valid_menus_obj);
		}
	}
	jsonObj.valid_menus = valid_menus_array;
	console.log((JSON.stringify(jsonObj)));
	$(".solution").text(JSON.stringify(jsonObj));
}

// Recursive function to get ancestors of a certain node
function getAncestors(g, v) {
	var up = g.predecessors(v);
	return up.concat(up.reduce(function(sum, u) {
		return sum.concat(getAncestors(g, u));
	}, []));
}

function sortNumber(a,b) {
	return a - b;
}

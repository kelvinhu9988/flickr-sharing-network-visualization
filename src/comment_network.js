function draw_comment_network() {
    var user_info_path = 'data/userInfo.csv';
    d3.csv(user_info_path, function(error, user_info_data) {
        if (error) throw error;

        var nodes_data = [];
        var links_data = [];

        var width = 1080;
        var height = 600;
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) { return d.id; }))
            .force("collision", d3.forceCollide().radius(15))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 5, height / 2));

        function initialize_comment_network_data(index) {
            var user_row = user_info_data[index];
            var target_nodes = [];
            if (user_row["commentedby-ids"] != "")
                target_nodes = user_row["commentedby-ids"].split("|->|");
            var center_node_radius = target_nodes.length;

            nodes_data[0] = { "id": user_row["id"], "username": user_row["username"], "realname": user_row["username"],
                              "type": "center", "radius": 15 + 2 * center_node_radius > 30 ? 30 : 5 + 2 * center_node_radius,
                              "comments": user_row["commentedby-texts"].split("|->|"),
                              "commentedby-usernames": user_row["commentedby-usernames"].split("|->|") };

            counter = 1;
            for (i = 0; i < target_nodes.length; i++) {
                var node_id = target_nodes[i];
                var to_add = true;
                for (key in nodes_data) {
                    if (nodes_data[key]["id"] == node_id)
                        to_add = false;
                }
                if (to_add) {
                    var username = "";
                    var realname = "";
                    for (key in user_info_data) {
                        if (node_id == user_info_data[key]["id"]) {
                            username = user_info_data[key]["username"];
                            realname = user_info_data[key]["realname"];
                        }
                    }

                    nodes_data[counter] = { "id": node_id, "username": username, "realname": realname,
                                            "type": "comment", "radius": 15 + 2 * Math.random() };
                    counter++;
                }
            }

            for (i = 0; i < target_nodes.length; i++) {
                var node_id = target_nodes[i];
                links_data[i] = { "source": user_row["id"], "target": node_id, "type": "comment", "length": 105 + 10 * Math.random() };
            }

        }

        function update_comment_network() {
            var index = Math.floor(Math.random() * 1565);
            initialize_comment_network_data(index);

            var updated = false;

            if (d3.select("#g-comment-network")._groups[0][0] != null)
                updated = true;

            if (!updated)
                create_network();
            else
                update_comment_network();

            nodes_data = [];
            links_data = [];

        }

        d3.select('#update-comment-network')
            .on('click', update_comment_network);

        update_comment_network();

        function create_network() {

            var svg = d3.select("#comment-network")
                .append("svg")
                .attr("class", "svg-container")
                .attr("height", height);

            var g = svg.append("g")
                .attr("id", "g-comment-network");

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0]);
            g.call(tip);

            var link = g.append("g").attr("class", "links")
                .selectAll("line").data(links_data).enter()
                .append("line")
                    .attr("class", function(d) {
                        return d.type;
                    });

            var node = g.append("g").attr("class", "nodes")
                        .selectAll("circle").data(nodes_data).enter()
                        .append("circle")
                            .attr("r", function(d) { return d.radius; })
                            .attr("class", function(d) { return d.type; })
                            .on("mouseover", function(d) {
                                d3.select(this)
                                    .transition().duration(200)
                                    .attr("r", function(d) {
                                        if (d.type != "center")
                                            return 2 * d.radius > 35 ? 35 : 2 * d.radius
                                        else {
                                            return d.radius;
                                        }
                                    });
                                var tip_message = "User ID: " + d["id"] + "<br>Username: " + d["username"] + "<br>Real name: " + d["realname"];
                                tip.html(tip_message);
                                tip.show();
                                link.style('stroke-width', function(l) {
                                    if (d == l.target)
                                        return 10;
                                });
                            })
                            .on('mouseout', function(d) {
                                d3.select(this)
                                .transition().duration(200)
                                .attr("r", function(d) { return d.radius; });
                                tip.hide();
                                link.style('stroke-width', function(l) {
                                    if (d == l.target)
                                        return 1;
                                });
                            })
                            .call(d3.drag()
                                    .on("start", dragstarted)
                                    .on("drag", dragged)
                                    .on("end", dragended));

            simulation.nodes(nodes_data).on("tick", ticked);
            simulation.force("link").links(links_data).distance(function(d) { return d.length; });

            var zoom = d3.zoom()
                .scaleExtent([1, 8])
                .translateExtent([[-100, -100], [width + 100, height + 100]])
                .on("zoom", zoomed);
            zoom.scaleBy(svg, 1.5);
            svg.call(zoom);

            var html_message = "<br><br>";
            for (key in nodes_data[0]["comments"]) {
                html_message += "<em>" + nodes_data[0]["commentedby-usernames"][key] + "</em>: " + nodes_data[0]["comments"][key] + "<br><br>";
            }
            d3.select("#comment-container").html(html_message);

            function ticked() {
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                node.attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
            }

            function zoomed() {
                g.attr("transform", d3.event.transform);
            }
        }

        function update_network() {

        }

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    });

}



draw_comment_network();

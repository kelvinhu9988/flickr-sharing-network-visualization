function draw_photo_similarity_network() {

    var links_path = "data/edge.csv";
    var nodes_path = "data/node_with_comments.csv";

    var margin = { top: 0, right: 0, bottom: 0, left: 0 },
        outerWidth = 1080,
        outerHeight = 600,
        width = outerWidth - margin.left - margin.right,
        height = outerHeight - margin.top - margin.bottom;

    var svg = d3.select("#photo-network")
        .append("svg")
        .attr("class", "svg-container")
        .attr("height", height);

    var g = svg.append("g")
        .attr("id", "g-photo-network");


    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0]);

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("collision", d3.forceCollide().radius(10))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 3, height / 2));





    // Photo Similarity Network
    d3.csv(nodes_path, function(error, nodes) {
        if (error) throw error;

        var nodes_data;
        var links_data;
        var node_collector = [];
        var count = 0;
        nodes.forEach(function(row) {
            node_collector[count] = { "id": row["id"], "type": row["type"], "radius": 5 + 2 * Number(row["radius"]), "labels": row["labels"].split("|") };
            count++;
        });
        nodes_data = node_collector;
        d3.csv(links_path, function(links) {
            var link_collector = [];
            var count = 0;
            links.forEach(function(link) {
                link_collector[count] = {"source": link["source"], "target": link["target"], "type": link["type"], "length": 75 + 10 * Number(link["length"])};
                count++;
            });
            links_data = link_collector;
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
                    .attr("r", function(d) {
                        return d.radius;
                    })
                    .attr("class", function(d) {
                        return d.type;
                    })
                    .on("mouseover", function(d) {
                        d3.select(this)
                            .transition().duration(200)
                            .attr("r", 25);
                        var tip_message = "Photo ID: " + d["id"];
                        tip.html(tip_message);
                        tip.show();

                        link.style('stroke-width', function(l) {
                            if (d == l.target)
                                return 10;
                        });
                        draw_word_cloud(d["labels"]);
                    })
                    .on('mouseout', function(d) {
                        d3.select(this)
                        .transition().duration(200)
                        .attr("r", function(d) {
                            return d.radius;
                        });
                        tip.hide();
                        link.style('stroke-width', function(l) {
                            if (d == l.target) {
                                if (l.type == "tag")
                                    return 0.5;
                                else if (l.type == "user")
                                    return 2;
                            }
                        });
                        destroy_world_cloud();
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

            function draw_word_cloud(labels) {
                var frequency_list = []
                for (label in labels)
                    frequency_list.push({ "text": labels[label], "size": 30 });

                var color = d3.scaleOrdinal(d3.schemePastel2);

                d3.layout.cloud().size([200, 600])
                    .words(frequency_list)
                    .rotate(0)
                    .fontSize(function(d) { return d.size; })
                    .on("end", draw)
                    .start();

                function draw(words) {
                    var word_cloud = d3.select("#word-cloud-container").append("svg")
                        .attr("height", 600)
                        .attr("class", "word-cloud")
                        .append("g")
                        .attr("transform", "translate(100, 300)")
                        .selectAll("text")
                        .data(words)

                    word_cloud.enter().append("text")
                        .style("font-size", function(d) { return d.size + "px"; })
                        .style("fill", function(d, i) { return color(i); })
                        .attr("transform", function(d) {
                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .text(function(d) { return d.text; });

                    word_cloud.exit().remove();
                }
            }

            function destroy_world_cloud() {
                d3.select("#word-cloud-container").selectAll(".word-cloud").remove();
            }

        });
    });

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
}

draw_photo_similarity_network();

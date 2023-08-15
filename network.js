export const networkPlot = () => {
    let width;
    let height;
    let data;
    let colours = [
        "#41b6c4",
        "#CA054D",
        "#3B1C32",
        "#B96D40",
        "#F9C846",
        "#6153CC",
    ];

    const my = (selection) => {
        const simulation = d3
            .forceSimulation(data.nodes)
            .force(
                "link",
                d3.forceLink(data.links).id((d) => d.id)
            )
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = selection
            .append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke-width", 0.2)
            .attr("class", "network");

        const node = selection
            .append("g")
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("r", 5)
            .attr("fill", (d) => colours[d.tau])
            .attr("class", "network")
            .attr("id", (d) => d.id);

        node.append("title").text((d) => d.id);

        simulation.on("tick", () => {
            if (data.nodes.length <= 20) {
                link.attr("x1", (d) => d.source.x)
                    .attr("y1", (d) => d.source.y)
                    .attr("x2", (d) => d.target.x)
                    .attr("y2", (d) => d.target.y);
            }
            node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        });

        // var link = selection
        //     .selectAll("line")
        //     .data(data.links)
        //     .enter()
        //     .append("line")
        //     .style("stroke", "#aaa");

        // // Initialize the nodes
        // var node = selection
        //     .selectAll("circle")
        //     .data(data.nodes)
        //     .enter()
        //     .append("circle")
        //     .attr("r", 20)
        //     .style("fill", "#69b3a2");

        // // Let's list the force we wanna apply on the network
        // var simulation = d3
        //     .forceSimulation(data.nodes) // Force algorithm is applied to data.nodes
        //     .force(
        //         "link",
        //         d3
        //             .forceLink() // This force provides links between nodes
        //             .id(function (d) {
        //                 return d.id;
        //             }) // This provide  the id of a node
        //             .links(data.links) // and this the list of links
        //     )
        //     .force("charge", d3.forceManyBody().strength(-400)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        //     .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
        //     .on("end", ticked);

        // // This function is run at each iteration of the force algorithm, updating the nodes position.
        // function ticked() {
        //     link.attr("x1", function (d) {
        //         return d.source.x;
        //     })
        //         .attr("y1", function (d) {
        //             return d.source.y;
        //         })
        //         .attr("x2", function (d) {
        //             return d.target.x;
        //         })
        //         .attr("y2", function (d) {
        //             return d.target.y;
        //         });

        //     node.attr("cx", function (d) {
        //         return d.x + 6;
        //     }).attr("cy", function (d) {
        //         return d.y - 6;
        //     });
        // }
    };
    my.width = function (_) {
        return arguments.length ? ((width = _), my) : width;
    };
    my.height = function (_) {
        return arguments.length ? ((height = _), my) : height;
    };
    my.data = function (_) {
        return arguments.length ? ((data = _), my) : data;
    };
    my.get_node = function (id) {
        return data.nodes.filter((d) => d.id == id)[0];
    };
    return my;
};

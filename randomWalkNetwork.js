export const walkNetworkPlot = () => {
    let width;
    let height;
    let data;
    let colourValue;
    let colours;
    let walks;
    // let colours = [
    //     "#41b6c4",
    //     "#CA054D",
    //     "#3B1C32",
    //     "#B96D40",
    //     "#F9C846",
    //     "#6153CC",
    // ];

    const my = (selection) => {
        // const myTransition = d3.transition().duration(1000);

        const colourScale = d3
            .scaleSequential()
            .domain(d3.extent(data.nodes, colourValue))
            // .interpolator(d3.scaleDiverging(d3.interpolateSpectral));
            .interpolator(d3.interpolateViridis);

        // make discrete colour scale
        const colourScaleDisc = d3
            .scaleOrdinal()
            .domain(Object.keys(colours))
            .range(Object.values(colours));

        const simulation = d3
            .forceSimulation(data.nodes)
            .force(
                "link",
                d3.forceLink(data.links).id((d) => d.id)
            )
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 4, height / 2));

        // Only draw the links if the data length is less than 100
        const link = selection
            .append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("id", (d) => d.source.id + "-" + d.target.id)
            .attr("stroke-width", (d) => Math.sqrt(d.weight))
            .attr("class", "networkLinks");

        // Assign a colourScaleDisc if string, and colourScale if number
        data.nodes.forEach((d) => {
            d.colour =
                typeof colourValue(d) === "string"
                    ? colourScaleDisc(colourValue(d))
                    : colourScale(colourValue(d));
        });

        const node = selection
            .append("g")
            // .attr("stroke", "#fff")
            // .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("r", 5)
            .attr("fill", (d) => d.colour)
            .attr("tau", (d) => d.tau)
            .attr("class", "networkMarks")
            .attr("name", (d) => d.name)
            .attr("house", (d) => d.house)
            .attr("degree", (d) => +d.degree)
            .attr("good_bad", (d) => d.good_bad)
            .attr("id", (d) => d.id);

        node.append("title").text((d) => d.id);

        simulation.on("tick", () => {
            // if (data.nodes.length <= 20) {
            link.attr("x1", (d) => d.source.x)
                .attr("y1", (d) => d.source.y)
                .attr("x2", (d) => d.target.x)
                .attr("y2", (d) => d.target.y);
            // }

            node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        });
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
    my.colourValue = function (_) {
        return arguments.length ? ((colourValue = _), my) : colourValue;
    };
    my.colours = function (_) {
        return arguments.length ? ((colours = _), my) : colours;
    };
    my.walks = function (_) {
        return arguments.length ? ((walks = _), my) : walks;
    };
    my.runWalks = function (idx, speed, walkList) {
        console.log("running walks...");

        function fillWalkList(neighbourhood) {
            // Empty the list
            walkList.selectAll("*").remove();

            const walkItems = walkList
                .selectAll(".walk-item")
                .data(neighbourhood)
                .enter()
                .append("g")
                .attr("class", "walk-item")
                .attr("transform", (d, i) => `translate(30, ${5 + i * 20})`);

            walkItems
                .append("circle")
                .attr("r", 5)
                .attr("id", "walkCircle")
                .attr("transform", (d, i) => `translate(0, ${5})`)
                // .attr("fill", (d) => colours[1]);
                // .attr("fill", (d) => d.getAttribute("fill"));
                .attr("fill", (d) => d.colour);

            walkItems
                .append("text")
                .text((d) => d.name)
                // .text((d) => d.getAttribute("name"))
                .attr("x", 15)
                .attr("y", 10);
        }

        let j = 0;
        let intervalId;
        let sourceNode;
        let targetNode;
        let walkNodes;
        let node1;
        let node2;
        let neighbourhood = [];

        walkNodes = Object.values(walks[idx]).slice(1);
        // console.log(walkNodes);

        intervalId = setInterval(() => {
            node1 = +walkNodes[j];
            node2 = +walkNodes[j + 1];

            sourceNode = node1 < node2 ? node1 : node2;
            targetNode = node1 < node2 ? node2 : node1;

            const sourceCircle = document.getElementById(sourceNode);
            const sourceCircleCopy = Object.assign({}, sourceCircle);

            neighbourhood.push(sourceCircleCopy.__data__);
            fillWalkList(neighbourhood);

            d3.select(document.getElementById(sourceNode + "-" + targetNode))
                .attr("stroke", "#6153CC")
                .attr("stroke-width", 5)
                .transition()
                .duration(500)
                .attr("stroke-width", 1.5)
                // .attr("stroke", this.colourValue());
                .attr("stroke", "red");

            d3.select(document.getElementById(node2))
                .attr("fill", "#6153CC")
                .attr("r", 10)
                .transition()
                .duration(500)
                .attr("r", 5)
                .attr("fill", (d) => d.colour);

            if (j <= walkNodes.length - 3) {
                j = j + 1;
            } else {
                clearInterval(intervalId);
            }
        }, speed);
    };

    return my;
};

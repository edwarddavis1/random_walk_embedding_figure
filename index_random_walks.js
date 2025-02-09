import { scatterPlot } from "./scatterPlot.js";
import { networkPlot } from "./network.js";
import { walkNetworkPlot } from "./randomWalkNetwork.js";
// import { networkPlot } from "./networkNoAnimate.js";

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Load data from data.json
async function loadGraph() {
    const data = await d3.json("./data/emnity_graph.json");
    return data;
}

async function loadWalks(n) {
    const data = await d3.csv(`./hp_walks/walks_save${n}.csv`);
    return data;
}

// Load data from plot_df.csv
async function loadEmbedding() {
    const data = await d3.csv("./data/plot_df.csv");

    // convert strings to numbers
    data.forEach((d) => {
        d.x_emb = +d.x_emb;
        d.y_emb = +d.y_emb;
        d.degree = +d.degree;
    });

    return data;
}

// Create div for legend
d3.select("body").append("div").attr("class", "legend");
const legend = d3
    .select(".legend")
    .append("svg")
    .attr("width", width / 5)
    .attr("height", height)
    .style("position", "absolute")
    .style("top", "20")
    .style("right", "0");

// Create a network plot from the data
async function main() {
    let t = 0;

    let goodBadColours = { 1: "#CA054D", 0: "#41b6c4" };
    let houseColours = {
        g: "#ae0001",
        s: "#2a623d",
        r: "#222f5b",
        h: "#f0c75e",
        m: "#372e29",
        n: "#bebebe",
    };
    let topFiveColours = {
        1: "#3B1C32",
        0: "#B96D40",
    };

    const goodBadCategories = ["Good", "Bad"];
    const houseCategories = [
        "Gryffindor",
        "Slytherin",
        "Ravenclaw",
        "Hufflepuff",
        "Muggle",
        "None",
    ];
    const topFiveCategories = ["Main Character", "Not Main Character"];

    function fillLegend(colours, categories) {
        legend.selectAll("*").remove();

        const legendItems = legend
            .selectAll(".legend-item")
            .data(categories)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(30, ${5 + i * 20})`);

        legendItems
            .append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", (d, i) => Object.values(colours)[i]);

        legendItems
            .append("text")
            .text((d) => d)
            .attr("x", 15)
            .attr("y", 10);
    }

    fillLegend(goodBadColours, goodBadCategories);

    const embeddingData = await loadEmbedding();
    const filteredData = embeddingData.filter((d) => d.t == t);
    const scatter = scatterPlot()
        .width(width)
        .height(height)
        .data(filteredData)
        .margin({
            top: 30,
            right: width / 5,
            bottom: 100,
            // left: 60,
            left: (2 * width) / 5,
        })
        .size(5)
        .xValue((d) => d.x_emb)
        .yValue((d) => d.y_emb)
        .yAxisLabel("Embedding Dimension 2")
        .xAxisLabel("Embedding Dimension 1")
        .xDomain(d3.extent(embeddingData, (d) => d.x_emb))
        .yDomain(d3.extent(embeddingData, (d) => d.y_emb))
        .colours(goodBadColours)
        .colourValue((d) => d.good_bad);

    // svg.call(scatter);

    const graphWalks = await loadWalks(0);
    // console.log(graphWalks);

    const graphData = await loadGraph();
    // const network = networkPlot()
    const network = walkNetworkPlot()
        // .width(width / 2)
        .width(width)
        .height(height)
        .walks(graphWalks)
        .colourValue((d) => d.good_bad)
        .colours(goodBadColours)
        .data(graphData);
    svg.call(network);

    let colours = [
        "#41b6c4",
        "#CA054D",
        "#3B1C32",
        "#B96D40",
        "#F9C846",
        "#6153CC",
    ];

    /////////////////////////////
    //// Interactiveness ////////
    /////////////////////////////

    // Define the tooltip element
    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute");

    function interactivity() {
        // svg.selectAll(".scatterPoints, .networkMarks")
        svg.selectAll("circle")
            .on("mouseover", function (event) {
                // console.log(this);

                // Show the tooltip with the data
                tooltip
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9)
                    .style("background-color", colours[0]);
                tooltip
                    .html(this.getAttribute("name"))
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + 10 + "px");

                d3.select(this).attr("r", 10);

                d3.selectAll(".scatterPoints, .networkMarks")
                    .attr("fill", (d) => {
                        if (d.id == this.id) {
                            return colours[4];
                        } else {
                            return d.colour;
                            // return colours[1];
                        }
                    })
                    .attr("r", (d) => {
                        if (d.id == this.id) {
                            return 10;
                        } else {
                            return 5;
                        }
                    });
            })
            .on("mouseout", function (d) {
                // Hide the tooltip
                tooltip
                    .transition()
                    .duration(500)
                    .style("opacity", 0)
                    .on("end", function () {
                        // Disable mouse events on the tooltip div when it is hidden
                        tooltip.style("pointer-events", "none");
                    });

                d3.select(this).attr("r", 5).attr("stroke", "none");

                d3.selectAll(".scatterPoints, .networkMarks")
                    .attr("fill", (d) => {
                        return d.colour;
                    })
                    .attr("r", 5);
            });
    }

    interactivity();
    //////////////////////////////
    /////// Animation ////////////
    //////////////////////////////

    // Walk list div
    d3.select("body").append("div").attr("class", "walkList");
    const walkList = d3
        .select(".walkList")
        .append("svg")
        .attr("width", width / 2)
        .attr("height", height)
        .style("position", "absolute")
        .style("top", `${(height / 3) * 1}`)
        // .style("bottom", `${(height / 4) * 3}`)
        .style("left", `${width / 2}`);

    let intervalId;
    let walkNum = graphWalks.length;
    let currentWalk = 0;
    let speed = 300;

    network.runWalks(currentWalk, speed, walkList);
    intervalId = setInterval(() => {
        console.log(currentWalk);
        if (currentWalk < walkNum) {
            currentWalk++;
            network.runWalks(currentWalk, speed, walkList);
        } else {
            clearInterval(intervalId);
        }
    }, speed * 15);
    // }, speed * 5000000);

    // options dropdown to change the speed of the animation
    d3.select("body")
        .append("text")
        .text("Speed: ")
        .attr("class", "speed-text")
        .style("position", "absolute")
        .style("bottom", "20px")
        .style("left", `${width / 5 - 100}px`);

    const speedSelect = d3
        .select("body")
        .append("select")
        .attr("class", "speed-select")
        .style("position", "absolute")
        .style("bottom", "15px")
        .style("left", `${width / 5 - 45}px`)
        .style("padding", "5px 10px")
        .style("border", "none")
        .style("background-color", colours[0])
        .style("color", "#fff")
        .style("font-size", "16px")
        .style("cursor", "pointer");

    const speedOptions = speedSelect
        .selectAll("option")
        .data(["Slow", "Medium", "Fast"])
        .enter()
        .append("option")
        .text((d) => d)
        .style("background-color", colours[0])
        .style("color", "#fff");

    speedSelect.on("change", () => {
        const value = speedSelect.property("value");
        if (value === "Slow") {
            speed = 300;
        } else if (value === "Medium") {
            speed = 50;
        } else if (value === "Fast") {
            speed = 1;
        }
        clearInterval(intervalId);
        network.runWalks(currentWalk, speed, walkList);
        intervalId = setInterval(() => {
            if (currentWalk < walkNum) {
                currentWalk++;
                network.runWalks(currentWalk, speed, walkList);
            } else {
                clearInterval(intervalId);
            }
        }, speed * 15);
        // }, speed * 500000);
    });

    d3.select("body")
        .append("text")
        .text("Colour: ")
        .attr("class", "colour-text")
        .style("position", "absolute")
        .style("bottom", "20px")
        .style("left", `${width / 2}px`);

    const select = d3
        .select("body")
        .append("select")
        .attr("class", "colour-select")
        .style("position", "absolute")
        .style("bottom", "15px")
        .style("left", `${width / 2 + 55}px`)
        .style("padding", "5px 10px")
        .style("border", "none")
        .style("background-color", colours[0])
        .style("color", "#fff")
        .style("font-size", "16px")
        .style("cursor", "pointer");

    const options = select
        .selectAll("option")
        .data(["Good/Bad", "House", "Degree", "Top Five"])
        .enter()
        .append("option")
        .text((d) => d)
        .style("background-color", colours[0])
        .style("color", "#fff");

    select.on("change", () => {
        const value = select.property("value");
        svg.selectAll("circle, .networkLinks").remove();
        if (value === "Degree") {
            // scatter.colourValue((d) => d.degree);
            network.colourValue((d) => d.degree);
        } else if (value === "House") {
            // scatter.colours(houseColours);
            // scatter.colourValue((d) => d.house);
            network.colours(houseColours);
            network.colourValue((d) => d.house);
            fillLegend(houseColours, houseCategories);
        } else if (value === "Good/Bad") {
            // scatter.colours(goodBadColours);
            // scatter.colourValue((d) => d.good_bad);
            network.colours(goodBadColours);
            network.colourValue((d) => d.good_bad);
            fillLegend(goodBadColours, goodBadCategories);
        } else if (value === "Top Five") {
            network.colours(topFiveColours, topFiveCategories);
            network.colourValue((d) => d.main);
            fillLegend(topFiveColours, topFiveCategories);
        }
        // svg.call(scatter);
        svg.call(network);

        interactivity();
    });
}

main();

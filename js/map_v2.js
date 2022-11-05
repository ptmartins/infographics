(function() {
  'use strict';
  
  let width  = document.querySelector('.map-center').offsetWidth,
      height = document.querySelector('.map-center').offsetHeight,
      scale  = ( width < 1.75 * height ? width : height * 1.75)/6.275,

      svg = d3.select('.map-center')
        .append('svg')
        .attr('width', width)
        .attr('height', height),

      g = svg.append('g'),

      tooltip = d3.select('.map-center')
        .append('div')
        .attr('class', 'tooltip'),

      projection = d3.geoMercator()
        .center([0,20])          
        .scale(scale)                 
        .translate([ width/2, height/2 ]),

      mouseover = () => {
        tooltip.style("opacity", 1)
      },
      
      mousemove = (d) => {
        tooltip
          .html(`<h1> ${d.ins} </h1>`)
          .style('left', (d3.mouse(d3.event.currentTarget)[0]+10) + 'px')
          .style('top', (d3.mouse(d3.event.currentTarget)[1]) + 'px')
      },

      mouseleave = function(d) {
        tooltip.style('opacity', 0)
      },

      ready = (error, dataGeo, data) => {

        var cluster = d3.fuse()
          .nodes(data)
          .fuse(); 

        console.log('A:', cluster);

        let valueExtent = d3.extent(data, d => +d.ins),
            size = d3.scaleSqrt()
              .domain(valueExtent) 
              .range([ 1, 100]); 

        // Render the map
        g.selectAll('path')
          .data(dataGeo.features)
          .enter()
          .append('path')
          .attr('fill', '#90cef0')
          .attr('d', d3.geoPath()
          .projection(projection)
          )
          .style('stroke', 'none')
          .style('opacity', .3)

        // Add bubbles
        svg.selectAll('circle')
          .data(
            data.sort((a, b) => {
                return +b - +a  
              })
              .filter((d, i) => {
                return d.pop > 0  // only show countries with members
              })
          )
          .enter()
          .append('circle')
            .attr('cx', d => projection([+d.lng, +d.lat])[0])
            .attr('cy', d => projection([+d.lng, +d.lat])[1])
            .attr('r', d => size(+d.ins))
            .style('fill', '#172984')
            .attr('fill-opacity', .9)
            .attr('class', 'bubble')
          .on('mouseover', mouseover.bind(this))
          .on('mousemove', mousemove)
          .on('mouseleave', mouseleave);

        var zoom = d3.zoom()
          .scaleExtent([1, 8])
          .on('zoom', function() {
            g.selectAll('path')
              .attr('transform', d3.event.transform);
            svg.selectAll('circle')
              .attr('transform', d3.event.transform);
          });

        svg.call(zoom);

      };

      d3.queue()
        .defer(d3.json, 'data/world_countries.json')  // Geo data
        .defer(d3.tsv, 'data/people.tsv') // People data
        .await(ready);

})();

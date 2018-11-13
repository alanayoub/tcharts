TCharts
=======

TCharts is a vector graphics (SVG / VML) charting library based off of Raphaël.

It only actually supports Bar charts at the moment however it's featureset in that area is reasonably good.

Features
--------
* Multi-level grouped bars
* Stacked bars
* Multiple axes
* Axes formatters
* Rotated xaxis labels (either ways)
* Tests
* Configuration options for spacing, colours etc

[Examples](http://timetriclabs.bitbucket.org/tcharts/test/ "TCharts examples")

Requirements
------------
Raphaël and at the moment jQuery, I'm planning on removing the jQuery dependency however, it's barely used.

Also if you plan on using this in an older browser you will need to polyfill some ES5 stuff like **map**, **filter**, **reduce** etc.

Usage
-----
See examples

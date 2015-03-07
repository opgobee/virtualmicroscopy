/*
* Segmenter: to demarcate areas in images
* Dependencies: svg-x.x.x..min.js
*
*/

var svgArea; 

//initialize svg canvas
jQ( document ).ready(function() {
	
	if (SVG.supported) 
	{
		svgArea = SVG('svgContainer');
		svgArea.attr("style", "border: 1px solid #ff0000;");
		svgArea.shapeObjects = Array();
		svgArea.activeShapeObject = null;
		svgArea.activeShape = null;
		svgArea.activeTool = null;
		
	//	SVG.Element.draggable.goStart = function() {return start}
		//test
		svgArea.activeTool = "createPolygon";
	   	var newPolygon = new Polygon();	
    	svgArea.shapeObjects.push(newPolygon);
    	svgArea.activeShapeObject = newPolygon;
		
		//set the passed object to be the active shape
		svgArea.selectAsActiveShape = function(object) 
		{
			svgArea.deselectActiveShape();
			svgArea.activeShape = object;
			if(object.showAsActive)
			{
				object.showAsActive();
			}
		}

		//deslect the registered active object, if any
		svgArea.deselectActiveShape = function() 
		{
			var object = svgArea.activeShape;
			svgArea.activeShape = null;
			if(object && object.showAsInactive)
			{
				object.showAsInactive();
			}
		}

	} 
	else 
	{
		alert('Your browser unfortunately does not support SVG, the technique used for segmenting.\nPlease switch to one of the following browsers to allow segmenting:\n\nDESKTOP:\n  Firefox 3+\n  Chrome 4+\n  Safari 3.2+\n  Opera 9+\n  Internet Explorer 9+\n\nMOBILE:\n  iOS Safari 3.2+\n  Android Browser 3+\n  Opera Mobile 10+\n  Chrome for Android 18+\n  Firefox for Android 15+');
	}

	
	
	setTimeout("createPoly()",100);
	


}); //end document ready

/////////////////////////////
//extend events of basic cask microscopy viewer
/////////////////////////////
//http://stackoverflow.com/questions/4578424/javascript-extend-a-function

var old_handleMouseDown = handleMouseDown;
handleMouseDown = function(e) 
{
	//alert('body')
	//alert(downX + ", "+ downY);
	var imgFractionCoords= getImgCoords(cursorX,cursorY);	
	
	switch(svgArea.activeTool) {
    case "createPoint":
    	var newHandlePoint = new HandlePoint(imgFractionCoords.x,imgFractionCoords.y,e);
    	svgArea.shapeObjects.push(newHandlePoint);
    	return;
        break;
    case "createPolygon":
    	if(svgArea.activeShapeObject instanceof Polygon)
   		{
    		svgArea.activeShapeObject.addPoint(imgFractionCoords.x,imgFractionCoords.y,e);    		
   		}
    	return;
    	break;
    	
    default:
        
	}
	old_handleMouseDown.apply(this, arguments);
	
};






/////////////////////////////
//Constructors
/////////////////////////////

function createPoly()
{
	var polygon = svgArea.polygon('4992,5888 4512,6336 4320,7648 4928,8480 5824,8416 7072,7424 6560,7584 6176,7072 5120,6784').fill('#0000ff').opacity(0.5).stroke({ width: 3 })
}


function HandlePoint(imgFractionX,imgFractionY,e)
{	
	this.strokeWidth = 50;
	this.radius = 300;
	this.parentObject = null; //reference to a shape object (e.g. polygon object) that contains this handlepoint
	this.imgFractionX = imgFractionX; //location on image, expressed in image fraction (0-1)
	this.imgFractionY = imgFractionY; //location on image, expressed in image fraction (0-1)
	var fullImgX = imgFractionX * imgWidthMaxZoom; //location on image of max image size, expressed in pixels
	var fullImgY = imgFractionY * imgHeightMaxZoom;
	
	//returns the x position of this handlePoint, expressed in imgage fraction (0-1)
	this.getImgFractionX = function()
	{
		return this.imgFractionX;
	}

	//returns the y position of this handlePoint, expressed in imgage fraction (0-1)
	this.getImgFractionY = function()
	{
		return this.imgFractionY;
	}
	
	//sets this handlePoint as the active shape in svgArea. This will consecutively call this.showAsActive
	this.selectAsActiveShape = function() 
	{
		svgArea.selectAsActiveShape(this);	
	}

	//apply 'active' style to this handlePoint
	this.showAsActive = function()
	{
		this.svgCircle.addClass('activeShape');
	}
	
	//remove 'active' style from this handlePoint
	this.showAsInactive = function()
	{
		this.svgCircle.removeClass('activeShape');
	}

	//set reference to possible shapeobject that conatins this handlePoint
	this.setParentObject = function(parentObject)
	{
		this.parentObject = parentObject;
	}
	
	//create the svg circle shape and attach it to the containingObject HandlePoint (=this)
	this.svgCircle = svgArea.circle(this.radius).center(fullImgX,fullImgY).addClass('handlePoint').style({'stroke-width' : this.strokeWidth});
	//create reference from the svg shape to the containingObject HandlePoint (this)
	this.svgCircle.parentObject = this;
	this.svgCircle.draggable();
	this.selectAsActiveShape();

	this.svgCircle.mousedown( function(event)
	{
		event.stopPropagation();
		var thisHandlePoint = this.parentObject;		
		thisHandlePoint.selectAsActiveShape();
		//transfer event to handlePoint
		thisHandlePoint.mousedown(event);
	});
	
	this.svgCircle.dragstart = function(event)
	{
		//set dragspeed according to zoom level
		this.svgCircle.startPosition.zoom /= Math.pow(2,(gTierCount-now.zoom-1));
		this.startImgFractionX = this.imgFractionX; //expressed in imgage fraction (0-1)
		this.startImgFractionY = this.imgFractionY;
	}.bind(this); //bind(this) : JavaScript cookbook ch 16.12 p383 and http://javascriptissexy.com/javascript-apply-call-and-bind-methods-are-essential-for-javascript-professionals/
	
	this.svgCircle.dragmove = function(delta, event) 
	{
		var imgFractionDeltaX = getImgFractionDeltaX(delta.x);//expressed in imgage fraction (0-1)
		var imgFractionDeltaY = getImgFractionDeltaY(delta.y);
		this.imgFractionX = this.startImgFractionX + imgFractionDeltaX; //expressed in imgage fraction (0-1)
		this.imgFractionY = this.startImgFractionY + imgFractionDeltaY;
		//this was for testing: document.getElementById('namePanel').innerHTML='x='+ this.imgFractionX + ', y=' + this.imgFractionY + ', deltax=' + imgFractionDeltaX + ', deltay=' + imgFractionDeltaY;		 
	}.bind(this); 


	this.mousedown = function(event)
	{
		//connect reference to this handlePoint object in the event
		event.targetObject = this;
		
		//transfer event to any containing shapeObject
		if(this.parentObject && this.parentObject.mousedown)
		{
			this.parentObject.mousedown(event);
		}
	}
	
	//start the dragging
	this.svgCircle.draggable.triggerStart(e);
/*	var evt = document.createEvent('MouseEvents');
	evt.initEvent("mousedown", true, true);
	evt.pageX= e.pageX;
	evt.pageY= e.pageY;
	this.svgCircle.node.dispatchEvent(evt);
*/
	
}

function Polygon()
{
	
	this.points= Array();
	this.isClosed = false; //is true when polygon has been closed
	//create polygon for the fill
	this.svgPolygon = svgArea.polygon().fill('#0000ff').opacity(0.5).stroke({ width: 0 })
	//create reference from the svg shape to the containingObject Polygon (=this)
	this.svgPolygon.parentObject = this;
	//create the svg polyline shape and attach it to the containingObject Polygon (=this)
	this.svgPolyline = svgArea.polyline().fill('none').stroke({ width: 50 });
	//create reference from the svg shape to the containingObject Polygon (=this)
	this.svgPolyline.parentObject = this;
	
	//custom mousedown (Polygon is a javascript object, not a html or svg element)
	this.mousedown = function(event)
	{
		//if the mousedown originated from a handlePoint of the polygon and that handlePoint was the start HandlePoint...
		if(event.targetObject && event.targetObject instanceof HandlePoint && this.isStartPoint(event.targetObject))
		{
			this.closePolygon();
		}
	}
	
	//@TODO: insert the added point on the correct line, not at the end of the coordinates array
	//http://stackoverflow.com/questions/17692922/check-is-a-point-x-y-is-between-two-points-drawn-on-a-straight-line
	this.svgPolyline.mousedown( function(event)
	{
		event.stopPropagation();
		//add point to the polygon
		var imgFractionCoords= getImgCoords(cursorX,cursorY);
		this.parentObject.addPoint(imgFractionCoords.x,imgFractionCoords.y,event);
	});
	
	this.svgPolygon.mousedown( function(event)
	{
		event.stopPropagation();
	});
	
	this.addPoint = function(x,y,e)
	{
		var newPoint = new HandlePoint(x,y,e);
		
		//create reference in the handlePoint to this Polygon object
		newPoint.setParentObject(this);
		
		//extend the dragmove handler to also update this polygon when the point is moved
		var old_dragmove = newPoint.svgCircle.dragmove;
		newPoint.svgCircle.dragmove = function(e)
		{
			this.update();
			old_dragmove.apply(newPoint, arguments);
		}.bind(this)
		
		this.points.push(newPoint);
		this.update();
	}
	
	this.isStartPoint = function(handlePoint)
	{
		return (handlePoint === this.points[0]);
	}
	
	/*
	 * gets an array of coordinates from the points
	 * @mode = 'asImgFractions' to get the coordinates expressed in image fraction (0-1) //default
	 * 			'asFullImgCoordinates'  to get the coordinates expressed in pixels on the full size image (=maximally enlarged)
	 * @return array of x-y-coord-arrays, eg: [[0,0], [0.4,0.22], [0.153,0.77], [0.73,0.2]]
	 */
	this.getCoordinates = function(mode)
	{
		var multiplierX = (mode == 'asFullImgCoordinates')? imgWidthMaxZoom : 1;  //default = 'asImgFractions' (then no multiplying)
		var multiplierY = (mode == 'asFullImgCoordinates')? imgHeightMaxZoom : 1; //default = 'asImgFractions' (then no multiplying)
		
		var point = {};
		var coordinates = [];
		var nrPoints= this.points.length;
		for (var i = 0; i <= nrPoints - 1; i++)
		{
			point.imgCoordX = this.points[i].getImgFractionX() * multiplierX; //expressed in image fraction (0-1) if mode = asImgFractions, expressed in pixels of full image if mode = 'asFullImgCoordinates'
			point.imgCoordY = this.points[i].getImgFractionY() * multiplierY;
			coordinates.push([point.imgCoordX,point.imgCoordY]);
		}
		return coordinates;
	}
	
	this.update = function()
	{
		var coordinates = this.getCoordinates('asFullImgCoordinates');
		if(this.isClosed)
		{
			//repeat first point at the end to also show a line on the last stretch
			var closedCoordinates = coordinates.slice(); //slice copies instead of making a reference. http://davidwalsh.name/javascript-clone-array; // stackoverflow.com/questions/7486085/copying-array-by-value-in-javascript
			closedCoordinates.push(coordinates[0]);			
			this.svgPolyline.plot(closedCoordinates);	
		}
		else
		{
			this.svgPolyline.plot(coordinates);			
		}
		this.svgPolygon.plot(coordinates);
	}
	
	this.closePolygon = function()
	{
		this.isClosed = true;		
		//stop with drawing of the polygon
		svgArea.activeTool = null;
		this.update();
	}
}

/////////////////////////////////////////////////////
//Extend Zoom functions with zooming of svg shapes
////////////////////////////////////////////////////

var old_ZoomIn = ZoomIn;
ZoomIn = function(e) 
{
	old_ZoomIn.apply(this, arguments);
	ZoomSvg(e);
}

var old_ZoomOut = ZoomOut;
ZoomOut = function(e) 
{
	old_ZoomOut.apply(this, arguments);
	ZoomSvg(e);
}

function ZoomSvg(e)
{
	
	//svg.js style
	if(typeof svgArea != "undefined")
	{
		
		var scale = 1 / (Math.pow(2,(gTierCount - 1 - now.zoom)));

		svgArea.scale(scale);
		svgArea.attr("width", imgWidthPresentZoom);
		svgArea.attr("height", imgHeightPresentZoom);
	}
	
/*	
 * native svg - succesful
 var svgContainer = document.getElementById("imageSegmentations");
	//alert(scale2);
	if(svgContainer)
	{
		svgContainer.setAttribute("transform","scale("+scale2+")");
		svgContainer.setAttribute("width", imgWidthPresentZoom);
		svgContainer.setAttribute("height", imgHeightPresentZoom);
	}
*/
	
/*
 * viewBox experiment - worked, but not succesful
 * var vb= document.getElementById("imageSegmentations").getAttribute("viewBox");
		
		var scale = Math.pow(2,(now.zoom - 2));
		var dims = new Array();
		dims[0] = 0;
		dims[1] = 0;
		dims[2] = imgWidthMaxZoom / scale;
		dims[3] = imgHeightMaxZoom / scale;
		
		var strDims = dims.join(" ");
		
		svgContainer.setAttribute("viewBox", strDims);
*/
	
/*	jQ( ".svg" ).each(function() {
		svgElem= $( this ).get(0);
		svgElem.setAttribute("transform","scale(2)") //does not work

	});
*/
}
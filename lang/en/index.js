var langStr={
	HELP:'Help',
	ACTIONS:'Actions',
	ACT_KEYMOVE:'Moving with keyboard buttons (k)',
	ACT_GLOBALMOVE:'Global move',
	ACT_GLOBALSIZE:'Global size',
	ACT_YONGUP:'Young numbers are flowing up.',
	ACT_BUILDROUTE:'Build a route',
	ACT_TEMPGLINES:'Drawing Guide Lines',
	FASTACT:'Fast actions:',
	FASTACT_SAVEMAP:'Save map position and size in memory.',
	FASTACT_NEWEMAP:'Create a new map (based on the current one).',
	FASTACT_NEWGROUP:'New group.',
	FASTACT_NEWPOINT:'New point.',
	FASTACT_COMPRESS:'Compress points.',
	FASTACT_IGNORDEL:'Delete ignore list.',
	MAPS:'Maps',
	HISTNAME:'History',
	GROUPS:'Groups',
	GROUPS_ALLON:'Enable all',
	GROUPS_ALLOFF:'Disable all',
	GROUPS_COMMON:'Common group',
	GROUPS_HISTORY:'History',
	GROUPCMENU:'Group menu',
	GROUPCMENU_MOVE:'Move',
	GROUPCMENU_REMOVE:'Remove',
	CONTMENU:'Point menu',
	CONTMENU_CHGROUP:'Change group',
	CONTMENU_DELPOINT:'Remove Item',
	CONTMENU_ADDIGNORE:'Ignore for routes',
	LANG:'<img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Flag_of_the_United_Kingdom_%281-2%29.svg" style="display: inline;height: 1em;">Lang',
	HELP_TEXT:'<br>-----The operating procedure is approximately as follows (quick start)----------\:<br> \
	we select the desired map on the right menu, as we progress through the game, we turn off the collected points individually by clicking on it in the map, and our path is remembered in history.<br> \
	If the map is new, we create it manually and at least one label, then this label can be moved, renamed and multiplied with alt pressed.<br> \
	At the end, double click on the name of the "group", the labels will be copied to the clipboard. Then paste it into settings.js with overwrite.<br> \
	<br>--------------Short description\:----------------<br> \
	There is a map in the center, the map can be moved by dragging, on the left are groups menu (it contains elements on the map), on the right we can see profiles menu (different maps).<br> \
	when you click on an element (circle) on the map, you can move it by dragging,<br> \
	when double-clicked, it is removed (hidden) on the map and in the left menu.<br> \
	when you hover over an element on the map, it highlights the text content<br> \
	dragging and releasing the mouse, while holding down the Alt key, will copy the element<br> \
	<br>\
	In the left menu, when you click on the name of a group, the list of this group opens/closes and the elements in the group appear.<br>\
	Clicking on the eye icon on a list item shows/hides it on the map, and also activates/deactivates the peephole itself.<br>\
	Clicking on the eye icon on the group name activates/deactivates the peephole itself, subelements, and also shows/hides them on the map.<br>\
	Double click on an element in the group - centers it on the map.<br> \
	Double clicking on any place on the map displays its coordinates in the console and copies them to the clipboard (service).<br> \
	<br>\
	In the profiles menu (on the right), when clicked on any map (profile), activates the profile and changes the card corresponding to the profile, also loads history and loads new groups (menu on the left),<br> \
	when you click on the label \"cards\" the profile menu opens/closes,<br>\
	when you click with Ctrl pressed on the “groups” label, the group menu opens/closes.<br> \
	<br>-----------Details--------<br> \
	<br>---Group \"History\"\:<br> \
	History is saved in localStorage<br>\
	Those elements that were deactivated by clicking on eye near the element (into the group) or by double clicking on the element on the map.<br> \
	<br>\
	History elements can activated by clicking on eye near it, can be deleted by clicking on the trash can, and you can also click on the "history" label while pressing alt - the history is cleared.<br> \
	<br>\
	It is now possible to move history entries by pressing shift (shift click turns on the moving mode), and when you hover over any element in history, it will be underlined with a blue line,<br> \
	indicating the landing location, then the click will fix the new position of the entry in history,<br> \
	while holding shift - cancel. The history is updated visually and dynamically, recording in local storage<br> \
	<br>\
	If you alt-click on the title of the history, the all entires of the history is cleared, you need to reload the page.<br>\
	<br>---In the group menu\:<br> \
	When you hover your mouse over the name of an element in a group, it comes to the foreground on the map.<br> \
	There is also a eye button to enable everything in group - it turns on all the elements that it contains, including elements on the map.<br> \
	By double-clicking on the label \"groups\", the array of profile and points positions is copied. Then paste it into settings.js with overwrite.<br> \
	<br>\
	If you press alt while double-clicking on the \"groups\" label, points (elements on map) sorted by history entires are copied to the clipboard.<br> \
	Сurrent points are taken not from saved groups, but from the map and only active ones,<br> \
	information on the points of the current map is taken from the markers on the map, the others - from the previous group settings.<br> \
	The history also changes regarding the new point numbers (ATTENTION), to replace the current group of points (i.e., so that nothing gets lost, you need to\: 1. switch to a new map (profile), then<br> \
	the latest changes will be saved. 2. After the operation, copy and save the result in settings.js).<br> \
	<br>\
	Shift + click on the group - selects the points of the group<br> \
	alt + click on the group - allows you to rename the group<br> \
	ctrl + click on the group - menu appears<br> \
	where you can:<br> \
	move group (also affects groups when collecting markers of the current map)<br> \
	delete group<br> \
	when moving, destination group selection is activated<br> \
	click - confirm and move<br> \
	ctrl + click - cancel<br> \
	just click on the group - opens/closes it<br> \
	<br>---Maps/profiles\:<br> \
	Shift + click on the map - allows you to rename it.<br> \
	<br>---Map\:<br> \
	Click on an element on the map while holding down the shift key - you can edit the text description. \
	<br>\
	If you hold down ctrl and click on map element, item menu appears, you can change his group number<br> \
	or remove the item itself or add the point to the ignore list<br> \
	Markers (elements) on the map can be moved while holding alt - then a copy of the mark is created<br> \
	Also added a method to cancel dragging if ctrl and shift are pressed.<br> \
	<br> \
	When you click with ctrl on the map, a circle appears, it turns off with the same way, the circle can be moved and enlarged using the [] buttons,<br> \
	The point is that when you hover circle over a many elements (markers), a list of what it contain with a number and description appears.<br>\
	<br>\
	Turning the wheel with alt and ctrl changes the map scale (zoom).<br>\
	<br>\
	New selection tool - selects on the map those points (elements) that you need\:<br>\
	by clicking shift on the map, then move the mouse and click again to define the rectangle,<br> \
	all points inside this rectangle will be included in the selected array, the points themselves will also be selected.<br> \
	<br>\
	shift + d - removes selection. \
	<br>---Actions<br> \
	Added a mode for mass dragging marks (elements,points) by pessing g key and resizing by pressing z.<br> \
	While holding shift - proportional change in the distances between marks (as if you decided to change the scale\
	maps and the labels need to be harmonize), without the shift key - the width and length are stretched differently, zg keys are no longer used, \
	in the new version it is possible to activate options via the keyboard (keys bindings based on the keyboard scan codes).\
	<br> \
	Global Move and Global Size now take into consideration selected elements (points). \
	<br>\
	Option to move with keys - the point (element) will be moved using the arrow keys on keyboard, there is also a hotkey in brackets. \
	<br>\
	In the action menu, it is now possible to show younger numbers on top of older ones. \
	<br>\
	option build a route - builds a route based on points on the map, also writes the last removed point to the beginning \
	allows you to change the size using the [] keys \
	<br> \
	Drawing lines - turns on the line drawing mode, click on the map - first point, then interactively click on the desired location of second point, \
	the line will fixed, then you can draw a new one or turn off this mode, also if you hold shift while selecting second point, \
	then the line will become straight. It is also possible to change the line color in the drawing toolbar; the default is the back color. <br> \
	It is now possible to select other tools, such as a permanent line. \
	Constant line - coordinates are written to memory for later export to settings.js. \
	Added line drawing settings - open by right-clicking on the permanent line icon, \
	each setting is opened with a left mouse click, the selected position is remembered in memory and used when drawing a line, \
	Also, when you select an option, the setting closes; some settings, such as the inscription, are remembered only when you close (click again) this setting. \
	<br>---Quick Actions<br> \
	Saving the position of current map (and other maps) in memory - saves the position for profile settings, for convenience, also saves zoom,<br> \
	new map (profile) - creates a new profile in memory with one new label, convenient if there are no cards at all or if you need to duplicate the current one<br> \
	new group - creates a new group in memory<br> \
	new point - creates a new point on map<br> \
	after all the manipulations, we need to copy all profiles - double click on the \"Groups\" inscription and put it in settings.js with overwriting<br> \
	<br>\
	The new action compress - compresses the selected points; if there are none, compresses all points. \
	<br> \
	Delete ignore list - deletes the ignore list from storage and memory \
	<br>---Settings settings.js<br> \
	You can determine the index from which the counting of numbers begins. This is the StartIndex field, it is outdated, but it works, it was needed when history only remembered numbers, regardless of the map.<br>\
	pointarr - link to an array of elements (points, circles) for a given map (profile)<br> \
	GpoupList - a list of groups <br> \
	',
};
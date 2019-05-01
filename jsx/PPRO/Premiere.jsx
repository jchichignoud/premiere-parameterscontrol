/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2014 Adobe
* All Rights Reserved.
*
* NOTICE: Adobe permits you to use, modify, and distribute this file in
* accordance with the terms of the Adobe license agreement accompanying
* it. If you have received this file from a source other than Adobe,
* then your use, modification, or distribution of it requires the prior
* written permission of Adobe. 
**************************************************************************/
#include "PPro_API_Constants.jsx"

$._PPP_={

	getParameter: function(){
		return app.project.activeSequence.getSelection()[0].components[1].properties[0].getValue()

	},

	setParameter: function(x, y) {

		app.project.activeSequence.getSelection()[0].components[1].properties[0].setValue([x, y], 1)
	},

	keepPanelLoaded: function () {
		app.setExtensionPersistent("com.adobe.PProPanel", 0); // 0, while testing (to enable rapid reload); 1 for "Never unload me, even when not visible."
	},

	getSep: function () {
		if (Folder.fs === 'Macintosh') {
			return '/';
		} else {
			return '\\';
		}
	},

	saveProject: function () {
		app.project.save();
	},

	projectPanelSelectionChanged: function (projectItems, viewID) {
		var remainingArgs = projectItems.length;
		var message = "";

		if (remainingArgs) {
			message = remainingArgs + " items selected: ";
			var view = viewID;

			// Concatenate selected project item names, into message. 
			for (var i = 0; i < projectItems.length; i++) {
				message += projectItems[i].name;
				remainingArgs--;
				if (remainingArgs > 1) {
					message += ', ';
				}
				if (remainingArgs === 1) {
					message += ", and ";
				}
				if (remainingArgs === 0) {
					message += ".";
				}
			}
		} else {
			message = 'No items selected.';
		}
		$._PPP_.updateEventPanel(message);
	},

	registerProjectPanelSelectionChangedFxn: function () {
		app.bind("onSourceClipSelectedInProjectPanel", $._PPP_.projectPanelSelectionChanged);
	},

	updateEventPanel: function (message) {
		app.setSDKEventMessage(message, 'info');
		//app.setSDKEventMessage('Here is some information.', 'info');
		//app.setSDKEventMessage('Here is a warning.', 'warning');
		//app.setSDKEventMessage('Here is an error.', 'error');  // Very annoying; use sparingly.
	},

	onPlayWithKeyframes: function () {
		var seq = app.project.activeSequence;
		if (seq) {
			var firstVideoTrack = seq.videoTracks[0];
			if (firstVideoTrack) {
				var firstClip = firstVideoTrack.clips[0];
				if (firstClip) {
					var clipComponents = firstClip.components;
					if (clipComponents) {
						for (var i = 0; i < clipComponents.numItems; ++i) {
							$._PPP_.updateEventPanel('component ' + i + ' = ' + clipComponents[i].matchName + ' : ' + clipComponents[i].displayName);
						}
						if (clipComponents.numItems > 2) {

							// 0 = clip
							// 1 = Opacity
							// N effects, then...
							// Shape layer (new in 12.0)

							var blur = clipComponents[2]; // Assume Gaussian Blur is the first effect applied to the clip.
							if (blur) {
								var blurProps = blur.properties;
								if (blurProps) {
									for (var j = 0; j < blurProps.numItems; ++j) {
										$._PPP_.updateEventPanel('param ' + j + ' = ' + blurProps[j].displayName);
									}
									var blurriness = blurProps[0];
									if (blurriness) {
										if (!blurriness.isTimeVarying()) {
											blurriness.setTimeVarying(true);
										}
										for (var k = 0; k < 20; ++k) {
											var updateUI = (k == 9); // Decide how often to update PPro's UI
											blurriness.addKey(k);
											var blurVal = Math.sin(3.14159 * i / 5) * 20 + 25;
											blurriness.setValueAtKey(k, blurVal, updateUI);
										}
									}
									var repeatEdgePixels = blurProps[2];
									if (repeatEdgePixels) {
										if (!repeatEdgePixels.getValue()) {
											updateUI = true;
											repeatEdgePixels.setValue(true, updateUI);
										}
									}
									// look for keyframe nearest to 4s with 1/10 second tolerance
									var keyFrameTime = blurriness.findNearestKey(4.0, 0.1);
									if (keyFrameTime !== undefined) {
										$._PPP_.updateEventPanel('Found keyframe = ' + keyFrameTime.seconds);
									} else {
										$._PPP_.updateEventPanel('Keyframe not found.');
									}

									// scan keyframes, forward

									keyFrameTime = blurriness.findNearestKey(0.0, 0.1);
									var lastKeyFrameTime = keyFrameTime;
									while (keyFrameTime !== undefined) {
										$._PPP_.updateEventPanel('keyframe @ ' + keyFrameTime.seconds);
										lastKeyFrameTime = keyFrameTime;
										keyFrameTime = blurriness.findNextKey(keyFrameTime);
									}

									// scan keyframes, backward
									keyFrameTime = lastKeyFrameTime;
									while (keyFrameTime !== undefined) {
										$._PPP_.updateEventPanel('keyframe @ ' + keyFrameTime.seconds);
										lastKeyFrameTime = keyFrameTime;
										keyFrameTime = blurriness.findPreviousKey(keyFrameTime);
									}

									// get all keyframes

									var blurKeyframesArray = blurriness.getKeys();
									if (blurKeyframesArray) {
										$._PPP_.updateEventPanel(blurKeyframesArray.length + ' keyframes found');
									}

									// remove keyframe at 19s
									blurriness.removeKey(19);

									// remove keyframes in range from 0s to 5s
									var shouldUpdateUI = true;
									blurriness.removeKeyRange(0, 5, shouldUpdateUI);
								}
							} else {
								$._PPP_.updateEventPanel("Please apply the Gaussian Blur effect to the first clip in the first video track of the active sequence.");
							}
						}
					}
				}
			}
		} else {
			$._PPP_.updateEventPanel("no active sequence.");
		}
	},

	onItemAddedToProject: function (whichProject, addedProjectItem) {
		var msg = addedProjectItem.name + " was added to " + whichProject + ".";
		$._PPP_.updateEventPanel(msg);
	},

	registerItemAddedFxn: function () {
		app.onItemAddedToProjectSuccess = $._PPP_.onItemAddedToProject;
	},

	myOnProjectChanged: function (documentID) {
		var msg = 'Project with ID ' + documentID + ' Changed.';
		// Commented out, as this happens a LOT.
		$._PPP_.updateEventPanel(msg);
	},

	registerProjectChangedFxn: function () {
		app.bind('onProjectChanged', $._PPP_.myOnProjectChanged);
	},

	myActiveSequenceChangedFxn: function () {
		$._PPP_.updateEventPanel(app.project.activeSequence.name + " changed, somehow.");
	},

	mySequenceActivatedFxn: function () {
		$._PPP_.updateEventPanel("Active sequence is now " + app.project.activeSequence.name + ".");
	},

	myActiveSequenceSelectionChangedFxn: function () {
		var sel = app.project.activeSequence.getSelection();
		$._PPP_.updateEventPanel(sel.length + ' track items selected in ' + app.project.activeSequence.name + '.');
		for (var i = 0; i < sel.length; i++) {
			if (sel[i].name !== 'anonymous') {
				$._PPP_.updateEventPanel('Selected item ' + (i + 1) + ' == ' + sel[i].name + '.');
			}
		}
	},

	myActiveSequenceStructureChangedFxn: function (){
		$._PPP_.updateEventPanel('Something in  ' + app.project.activeSequence.name + 'changed.');
	},
	
	registerActiveSequenceStructureChangedFxn: function () {
		var success	=	app.bind("onActiveSequenceStructureChanged", $._PPP_.myActiveSequenceStructureChangedFxn);
	},

	registerActiveSequenceChangedFxn: function () {
		var success	=	app.bind("onActiveSequenceChanged", $._PPP_.myActiveSequenceChangedFxn);
		//var success = app.bind("MZ::Scripting::kOnActiveSequenceChanged", $._PPP_.myActiveSequenceChangedFxn);
	},

	registerSequenceSelectionChangedFxn: function () {
		var success = app.bind('onActiveSequenceSelectionChanged', $._PPP_.myActiveSequenceSelectionChangedFxn);
	},

	registerSequenceActivatedFxn: function () {
		var success = app.bind('onSequenceActivated', $._PPP_.mySequenceActivatedFxn);
	},

	myTrackItemAdded: function (track, trackItem) {
		$._PPP_.updateEventPanel('onActiveSequenceTrackItemAdded : ' + track.name + ' : ' + trackItem.name + ' : ' + trackItem.nodeId + ".");
	},

	myTrackItemRemoved: function (track, trackItem) {
		$._PPP_.updateEventPanel('onActiveSequenceTrackItemRemoved : ' + track.name + ' : ' + trackItem.name + ' : ' + trackItem.nodeId + ".");
	},

	mySequenceStructureChanged: function () {
		$._PPP_.updateEventPanel('onActiveSequenceStructureChanged.');
	},

	registerSequenceMessaging: function () {
		app.bind('onActiveSequenceTrackItemRemoved', $._PPP_.myTrackItemRemoved);
		app.bind('onActiveSequenceTrackItemAdded', $._PPP_.myTrackItemAdded);
		app.bind('onActiveSequenceStructureChanged', $._PPP_.mySequenceStructureChanged);
	},
};

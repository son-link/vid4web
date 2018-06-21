#!/usr/bin/env node

const resolutions = [
	{
		res: 	'1920x1080',
		vb:		8000
	},
	{
		res: 	'1280x720',
		vb:		5000
	},
	{
		res: 	'854x480',
		vb:		2500
	}
];

const formats = [
	{
		vcodec:	'libx264',
		acodec:	'aac'
	},
	{
		vcodec:	'libvpx',
		acodec:	'libvorbis'
	}
]


// Declare variables
var input = null;
var output =  null;
var resolution = null;
var videobitrate = null;
var vcodec = null;
var acodec = null;
var command = null;
var cancelWin = null;

const libui = require('libui-node');
const ffmpeg = require('fluent-ffmpeg');
const i18n = require('i18n');
i18n.configure({
	directory: __dirname + '/locales'
});

const osLocale = require('os-locale');
locale = osLocale.sync().substr(0,2);
i18n.setLocale(locale);

var mmm = require('mmmagic');
var Magic = mmm.Magic;
var magic = new Magic(mmm.MAGIC_MIME_TYPE);

// The main windows
const window = libui.UiWindow('Vid4Web', 400, 200, true);
window.margined = true;

// The VerticalBox
const vbox = libui.UiVerticalBox();
vbox.padded = true
window.setChild(vbox);

const tabs = libui.UiTab();
vbox.append(tabs, false);

const vbox2 = libui.UiVerticalBox();
vbox2.padded = true;
tabs.append(i18n.__('Convert'), vbox2);

// Add button and label
const add_btn = libui.UiButton('<-');

const grid = libui.UiGrid();
grid.padded = true;
vbox2.append(grid, false)
var inputText = libui.UiLabel();

grid.append(libui.UiLabel(i18n.__('Input:')), 0, 0, 2, 1, 0, 0, 0, 1);
grid.append(add_btn, 2, 0, 2, 1, 0, 1, 1, 1);
grid.append(inputText, 4, 0, 2, 1, 0, 0, 0, 1);

// Output button and label
const out_btn = libui.UiButton('->');
var outText = libui.UiLabel();
grid.append(libui.UiLabel(i18n.__('Output:')), 0, 1, 2, 1, 0, 0, 0, 1);
grid.append(out_btn, 2, 1, 2, 1, 0, 1, 1, 1);
grid.append(outText, 4, 1, 2, 1, 0, 0, 0, 1);

// The form for config tab
const optForm = libui.UiForm();
optForm.padded = true;
tabs.append(i18n.__('Options'), optForm);
tabs.setMargined(0, true);
tabs.setMargined(1, true);

const chooseRes = libui.UiCombobox();
chooseRes.append(1080);
chooseRes.append(720);
chooseRes.append(480);
chooseRes.setSelected(0);
resolution = resolutions[0].res;
videobitrate = resolutions[0].vb;

optForm.append(i18n.__('Resolution:'), chooseRes, false);

const chooseFormat = libui.UiCombobox();
chooseFormat.append('mp4');
chooseFormat.append('webm');
chooseFormat.setSelected(0);
vcodec = formats[0].vcodec;
acodec = formats[0].acodec;
optForm.append(i18n.__('Format:'), chooseFormat, false);

hbox2 = libui.UiHorizontalBox();
hbox2.padded = true;

startButton = libui.UiButton(i18n.__('Start'));
startButton.enabled = false;
hbox2.append(startButton, false);

stopButton = libui.UiButton(i18n.__('Cancel'));
stopButton.enabled = false;
hbox2.append(stopButton, false);

vbox.append(hbox2, false);

progressLabel = libui.UiLabel('0%.')
vbox.append(progressLabel, false);

progressBar = libui.UiProgressBar();
vbox.append(progressBar, false);
progressBar.value = 0

hs = new libui.UiHorizontalSeparator();
vbox.append(hs, false);

hbox3 = libui.UiHorizontalBox();
hbox3.padded = true;
hbox3.append(libui.UiLabel(i18n.__('Status:')), false);

const statusLabel = libui.UiLabel();
hbox3.append(statusLabel, false);
vbox.append(hbox3, false);

libui.onShouldQuit(() => {
	window.close();
	cancelWin.close();
	libui.stopLoop();
});

window.onClosing(() => {
	if (command){
		command.kill().kill('SIGSTOP');
		stopButton.enabled = false;
	}
	libui.stopLoop();
});

add_btn.onClicked(() => {
	const filename = libui.UiDialogs.openFile(window);
	if (filename){
		input = filename;
		magic.detectFile(input, function(err, result) {
			if (! err){
				if(result.match(/^video\//)){
					inputText.setText(input);
				}
			}
		});
		enableStartBtn();
	}
});

out_btn.onClicked(() => {
	const filename = libui.UiDialogs.saveFile(window);
	if (filename){
		output = filename;
		outText.setText(output);
		enableStartBtn();
	}
});

chooseRes.onSelected(() => {
	id = chooseRes.getSelected();
	resolution = resolutions[id].res;
	videobitrate = resolutions[id].vb;
	enableStartBtn();
});

chooseFormat.onSelected(() => {
	id = chooseFormat.getSelected();
	vcodec = formats[id].vcodec;
	acodec = formats[id].acodec;
	enableStartBtn();
});

startButton.onClicked(() => {
	id = chooseRes.getSelected();
	if (id >= 0){
		resolution = resolutions[id].res;
		videobitrate = resolutions[id].vb;
		statusLabel.setText(i18n.__('Converting'));
		convert();
	}
});

stopButton.onClicked(() => {
	if (command && cancelWin === null){
		showCancelWin();
	}
});


function showCancelWin(){
	
	// Sub-window for ask is realy stop process.
	cancelWin = libui.UiWindow(i18n.__('Vid4Web: Cancel'), 200, 100, true);
	cancelWin.margined = true;
	vbox3 = libui.UiVerticalBox();
	vbox3.padded = true
	cancelWin.setChild(vbox3);

	const cancelLabel = libui.UiLabel(i18n.__('You really want to cancel the conversion?'));
	vbox3.append(cancelLabel, true);
	const hbox4 = libui.UiHorizontalBox();
	hbox4.padded = true;
	vbox3.append(hbox4, false);
	const btnCancelYes = libui.UiButton(i18n.__('Yes'));
	hbox4.append(btnCancelYes, false);
	const btnCancelNo = libui.UiButton(i18n.__('No'));
	hbox4.append(btnCancelNo, false);
	cancelWin.show();
	
	cancelWin.onClosing(() => {
		cancelWin.close();
		cancelWin = null;
	});
	
	btnCancelYes.onClicked(() => {
		if (command){
			command.kill();
			stopButton.enabled = false;
			cancelWin.close();
			cancelWin = null;
		}
	});

	btnCancelNo.onClicked(() => {
		cancelWin.close();
		cancelWin = null;
	});

}

// Show window and start loop
window.show();
libui.startLoop();

function convert(){
	if (input && output && resolution && videobitrate){
		stopButton.enabled = true;
		command = ffmpeg(input)
		.videoCodec(vcodec).videoBitrate(videobitrate).size(resolution)
		.audioCodec(acodec).audioBitrate('128k').audioFrequency(44100)
		.on('progress', function(progress) {
			percent = Math.round(progress.percent);
			progressBar.setValue(percent);
			progressLabel.setText(percent+'%.');
		})
		.on('end', function() {
			progressLabel.setText('100%');
			statusLabel.setText(i18n.__('Completed'));
			libui.UiDialogs.msgBox(window, i18n.__('Completed'), i18n.__('The video was converted correctly.'));
			progressBar.setValue(100);
			command.kill();
			command = null;
		})
		.on('error', function(err, stdout, stderr) {
			if (String(err).match('SIGKILL')){
				statusLabel.setText(i18n.__('Process canceled'));
			}else{
				statusLabel.setText(i18n.__('Cannot process video'));
				libui.UiDialogs.msgBoxError(window, i18n.__('Error'), i18n.__('An error occurred while processing the video.'));
			}
			progressBar.value = 0;
			progressLabel.setText('0%');
		}).save(output);
	}
}

function enableStartBtn(){
	if (input && output && resolution && videobitrate && vcodec && acodec){
		startButton.enabled = true;
	}
}

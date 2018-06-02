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

var input = null;
var output =  null;
var resolution = null;
var videobitrate = null;
var command = null;
const libui = require('libui-node');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

var mmm = require('mmmagic');
var Magic = mmm.Magic;
var magic = new Magic(mmm.MAGIC_MIME_TYPE);

const window = libui.UiWindow('Vid4Web', 400, 200, true);
window.margined = true;

// The VerticalBox
const vbox = libui.UiVerticalBox();
vbox.padded = true
window.setChild(vbox);

const add_btn = libui.UiButton();
add_btn.text = '<-'
//vbox.append(add_btn, false);

/*const form = libui.UiForm();
form.padded = true;
vbox.append(form, false);*/

const grid = libui.UiGrid();
grid.padded = true;
vbox.append(grid, false)
var inputText = libui.UiLabel();

grid.append(libui.UiLabel('Entrada:'), 0, 0, 2, 1, 0, 0, 0, 1);
grid.append(add_btn, 2, 0, 2, 1, 0, 1, 1, 1);
grid.append(inputText, 4, 0, 2, 1, 0, 0, 0, 1);

grid.append(libui.UiLabel('Salida:'), 0, 1, 2, 1, 0, 0, 0, 1);

/*var inputText = libui.UiLabel();
form.append('Entrada:', inputText, false);*/

const out_btn = libui.UiButton();
out_btn.text = '->';
var outText = libui.UiLabel();

grid.append(out_btn, 2, 1, 2, 1, 0, 1, 1, 1);
grid.append(outText, 4, 1, 2, 1, 0, 0, 0, 1);

//form.append('', out_btn, false);

//form.append('Salida:', outText, false);

const chooseRes = libui.UiCombobox();
chooseRes.append(1080);
chooseRes.append(720);
chooseRes.append(480);
hbox1 = libui.UiHorizontalBox();
hbox1.padded = true;
hbox1.append(libui.UiLabel('Resolución:'), false)
hbox1.append(chooseRes, false)
vbox.append(hbox1, false);

//form.append('Resolución:', choseRes, false);

hbox2 = libui.UiHorizontalBox();
hbox2.padded = true;

startButton = libui.UiButton();
startButton.text = 'Empezar';
startButton.enabled = false;
hbox2.append(startButton, false);

stopButton = libui.UiButton();
stopButton.text = 'Cancelar';
stopButton.enabled = false;
hbox2.append(stopButton, false);

vbox.append(hbox2, false);

progressLabel = libui.UiLabel('0%.')
vbox.append(progressLabel, false);

progressBar = libui.UiProgressBar();
vbox.append(progressBar, false);
progressBar.value = 0

libui.onShouldQuit(() => {
	window.close();
	libui.stopLoop();
});

window.onClosing(() => {
	if (command){
		command.kill().kill('SIGSTOP');
		stopButton.enabled = false;
		//command = null;
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
	console.log(filename);
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

startButton.onClicked(() => {
	id = chooseRes.getSelected();
	if (id >= 0){
		resolution = resolutions[id].res;
		videobitrate = resolutions[id].vb;
		convert();
	}
});

stopButton.onClicked(() => {
	if (command){
		command.kill().kill('SIGSTOP');
		stopButton.enabled = false;
		//command = null;
	}
});

window.show();
libui.startLoop();

function convert(){
	if (input && output && resolution && videobitrate){
		stopButton.enabled = true;
		command = ffmpeg(input)
		.videoCodec('libx264').videoBitrate(videobitrate).size(resolution)
		.audioCodec('aac').audioBitrate('128k').audioFrequency(44100)
		.on('progress', function(progress) {
			percent = Math.round(progress.percent);
			//console.log('Processing: ' + percent + '% done');
			progressBar.setValue(percent);
			progressLabel.setText(percent+'%.');
		})
		.on('end', function() {
			progressLabel.setText('100%. Completado');
			progressBar.setValue(100);
			command.kill();
			command = null;
		})
		/*.on('stderr', function(stderrLine) {
			console.log('Stderr output: ' + stderrLine);
		})*/
		.on('error', function(err, stdout, stderr) {
			console.log('Cannot process video: ' + err.message);
		}).save(output);
	}
}

function enableStartBtn(){
	if (input && output && resolution && videobitrate){
		startButton.enabled = true;
	}
}

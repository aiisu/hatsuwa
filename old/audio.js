/* Requires jQuery */

$.ajaxSetup({ cache: true }); /* http://forum.jquery.com/topic/jquery-turn-off-cache-busting-in-getscript */
//$.getScript("/AudioContextMonkeyPatch.js");
//$.getScript("/recorder.js");
/* http://stackoverflow.com/questions/1130921/is-the-callback-on-jquerys-getscript-unreliable-or-am-i-doing-something-wrong */
$.ajax({url:"AudioContextMonkeyPatch.js",dataType:'script',async:false}); 
$.ajax({url:"recorder.js",dataType:'script',async:false});


function playRandom(files){
  $('#player')[0].src=files[Math.floor(Math.random()*files.length)];
  $('#player')[0].play();
}

var theStream, recorder, recording = 0, fftSize = 2048;
var audioContext; 
var buf = new Uint8Array( fftSize );
var analyser;

function getUserMedia(dictionary, extraCallback) {
  try {
      audioContext = new AudioContext();
      if (!navigator.getUserMedia)
      	navigator.getUserMedia = navigator.webkitGetUserMedia;
      error = function(){alert('Stream generation failed.')};
      navigator.getUserMedia(dictionary, function(stream){gotUserMediaStream(stream), extraCallback(stream)}, error);
  } catch (e) {
      console.log('getUserMedia threw exception :' + e);
  }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);
    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function gotUserMediaStream(stream) {
  theStream = stream;
  
  // Create an AudioNode from the stream.
  var mediaStreamSource = audioContext.createMediaStreamSource(stream);

  // Connect recorder
  recorder = new Recorder(mediaStreamSource);

  // Connect it to the destination
  analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  convertToMono( mediaStreamSource ).connect( analyser );
}

function redrawAnalysis( time ) {
	var cycles = new Array;
	analyser.getByteTimeDomainData( buf );
  var sum=0;
  for (var i=0; i<fftSize; i++) {
    sum += Math.pow(buf[i]-128,2);
  }
  progressElem.setAmplitude(Math.sqrt(sum/fftSize)/5);
  if (recording) {
    if (!window.requestAnimationFrame)
	  	window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  	rafID = window.requestAnimationFrame( redrawAnalysis );
  }
  return 0;
}

var progressElem;
function startStopPractice(progressBar){
  progressElem = progressBar;

    startRecording();
  
}

function startRecording() {
    if (recorder) {recorder.clear();recorder.record();}
    recording = 1;
    redrawAnalysis();
}

function stopRecording(playerElem) {
    recording = 0;
    recorder.stop();
    recorder.exportWAV(function(s) {
      $(playerElem).get(0).src = window.URL.createObjectURL(s);
      $(playerElem).data("blob",s);
    }, 'audio/wav');
}

function startEcho(playerElem){
    $('.icon-stop').addClass('icon-microphone').removeClass('icon-stop');
    doPlayback(playerElem);
}

function doPlayback(playerElem) {
    $(playerElem).get(0).play();
}

function sendBlob() {
  recorder.exportWAV(function(blob) {
    form = new FormData(),
    request = new XMLHttpRequest();
    form.append("blob",blob);
    request.open(
            "POST",
            "/testaudio.php",
            true
            );
    request.send(form);    
  });
}



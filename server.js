http = require('http')
request = require('request')
fs = require('fs')
path = require('path')
express = require('express')
app = express.createServer()

app.get('/', function (req, res) {
    res.send('Copy the 8tracks playlist url and paste it in your browser as http://localhost:' + app.address().port + '/d/:user/:playlist')
})

app.get('/d/:user/:playlist', function (req, res) {
    var playlistName = req.params.playlist
    var playlistUrl = 'http://8tracks.com/' + req.params.user + '/' + playlistName
    res.write("Downloading playlist: " + playlistUrl + "\n\n")

    request(playlistUrl, function (error, response, body) {
        var playlistId = body.match(/mixes\/([0-9]+)\//)[1]
        console.log("Playlist id: " + playlistId + "\n")

        request('http://8tracks.com/sets/new?format=jsonh', function (error, response, body) {
            var token = JSON.parse(body)["play_token"]
            console.log("token: " + token + "\n")

            request('http://8tracks.com/sets/' + token + '/play?mix_id=' + playlistId + '&format=jsonh', function (error, response, body) {
                fs.mkdirSync(playlistName, 0777)
                downloadTrack(res, playlistId, token, JSON.parse(body)["set"], playlistName)
            })
        })
    })
})

function toFileName(name) { return name.replace(/[^a-zA-Z \-0-9]+/g, '-') }

/**
 * Downloads the current song in the playlist, then, if there are more, downloads more
 */
var downloadTrack = function (res, playlistId, token, playSet, playlistName) {
    var track = playSet["track"]
    var trackName = track["performer"] + " - " + track["name"]
    var trackUrl = track["track_file_stream_url"]
    res.write("Track: " + trackName + "\n")
    console.log("Downloading track: " + trackName + " from " + trackUrl + "\n")

    request(trackUrl).pipe(fs.createWriteStream(path.join(playlistName, toFileName(trackName) + ".m4a")))

    // get next song
    request('http://8tracks.com/sets/' + token + '/next?mix_id=' + playlistId + '&format=jsonh', function (error, response, body) {
        var playSet = JSON.parse(body)["set"]
        if (playSet["at_end"]) {
            res.end("All tracks downloaded, done!\n")
        } else {
            downloadTrack(res, playlistId, token, playSet, playlistName)
        }
    })
}


app.listen(9000)
console.log('Express server started on port %s', app.address().port)




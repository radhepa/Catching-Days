# Sara, the music kappa

A companion to the desktop toad, drawn in the same hand: a kappa on a lily pad
who floats a record in the dish on her head. She plays your own music, and
YouTube without the feed.

**Start her:** double-click `Start Sara.bat` (the first run downloads Electron,
about 100 MB). Or `npm install` then `npm start`.

## Giving her music

- **Drop songs or a whole folder on Sara**, or on the open player. Each song is
  named after its file (`03 - My_Song.mp3` becomes *My Song*).
- **Put files in `Music\Sara`** (right-click Sara, *Open Sara's folder*). Anything
  there joins her library by itself.
- **Add music…** in the player, or on her right-click menu.

mp3, m4a, aac, wav, ogg, opus, flac and webm all play.

## Playlists

*All songs* holds everything. *+ New playlist* makes one; songs dropped while a
playlist is open go into it. Use ⋯ on a song to add it to a playlist, take it
out, or remove it from Sara. Right-click a playlist to delete it (the songs stay).

## YouTube, without YouTube

The YouTube tab searches YouTube, or takes a pasted link. Tap a result to play
it; **+** keeps it in your library. It plays in YouTube's own player, shown
small and held to that one video: no recommendations, comments or feed, and
nothing in it opens a page. Close the player and the music keeps going while
Sara sits there with her record turning.

## Controls

- Tap Sara: open or close the player. Drag her to move her.
- Right-click Sara: play/pause, next, add music, her folder, size, quit.
- Media keys (play/pause, next, previous) work from anywhere.
- In the player: Space plays or pauses, Esc closes it.

Her library and settings live in `%APPDATA%\catching-days-sara\sara.json`.
Removing a song never deletes the file.

## For the curious

`main.js` runs the windows, reads folders, searches YouTube; `player.js` is
the player and the music engine; `pet.js` is Sara herself; `sara-art.js` is
her drawing (built from concept 4 in `concepts.html`); `library.js` holds the
plain rules (names, links, what plays next), checked by `npm test`.

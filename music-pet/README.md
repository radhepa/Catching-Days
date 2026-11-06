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

## Three yokai

Sara has two friends, both yokai, and any of them can be out:

- **Sara**, a kappa who floats a record in the dish on her head
- **Kon**, a kitsune with a shamisen and foxfire
- **Kasa**, a one-eyed paper umbrella who hops to the beat

Right-click the pet, then *Pet*, to pick the one who is out every day. A
playlist can have its own: right-click the playlist, then *Pet for this
playlist*. While a song from that playlist plays, its pet comes out.

Each pet breathes and blinks. It dances while music plays, fidgets now and
then, and dozes off after five minutes of quiet. It hops when you tap it or
when a new song comes on, and wiggles when you drop songs on it.

## YouTube, without YouTube

The YouTube tab searches YouTube, or takes a pasted link. Tap a result to play
it; **+** keeps it in your library. It plays in YouTube's own player, shown
small and held to that one video: no recommendations, comments or feed, and
nothing in it opens a page. Close the player and the music keeps going while
Sara sits there with her record turning.

## Controls

- Tap the pet: open or close the player. Drag it to move it.
- **Hide it in an edge:** drag it past the left, right or bottom of the screen.
  On a side it leans in from behind the edge; at the bottom it sinks till only
  its eyes show. Drag it out again whenever you like.
- Clicks go straight through the empty space round the pet.
- Right-click the pet: play/pause, next, add music, the folder, which pet, size
  (tiny to huge), quit.
- Media keys (play/pause, next, previous) work from anywhere.
- In the player: Space plays or pauses, Esc closes it.

Her library and settings live in `%APPDATA%\catching-days-sara\sara.json`.
Removing a song never deletes the file.

## For the curious

`main.js` runs the windows, reads folders, searches YouTube; `player.js` is
the player and the music engine; `pet.js` is the pet's window (peeking,
dragging, moods). The drawings are in `pets/`: `kit.js` is what they share,
and each pet has its own file. `pets/preview.html?pets=sara,kon` shows them in
every mood. `library.js` holds the
plain rules (names, links, what plays next), checked by `npm test`.

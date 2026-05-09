# Better WA-Compatible Timer

A better "World Archery Timing System"-compatible timer display for Archery.

This system acts as an improved timer for World Archery's [World Archery Timing System](https://web.archive.org/web/20260508224434/https://www.worldarchery.sport/sport/education/judging).

## System Requirements

- Windows 10 / 11, MacOS (on Apple Silicon), or Linux
- Multi-core CPU (4+ core, 2+GHz recommended)
- 1GB+ Storage
- 4GB+ RAM

## Setup

- Download the file, either by downloading the zip archive from GitHub, or:
  - ``git clone https://github.com/JamesPhillipsUK/better-wa-compatible-timer''
- Download a copy of the [World Archery timing system](https://web.archive.org/web/20260508224434/https://www.worldarchery.sport/sport/education/judging)
- Place the timing system executable file in the `src` folder.

## Running

- Navigate to the folder you've downloaded.
- If using Windows, from PowerShell, run `py src/start.py -fe` for the first run.
  - run `py src/start.py -e` for subsequent runs.
- If using MacOS / Linux, from the terminal, run `python3 src/start.py -e`.

## Notes

- The LED display page is served on localhost:5500/led-display/led-display.html.
- The message control centre is localhost:5500/message-controller/messages.html.
- The WA Timing system feed is expected to run on localhost:5001.
- The WA Timing system control centre is expected to run on localhost:5000.

### Messages

- The message control centre is localhost:5500/message-controller/messages.html.
- Messages can be accessed remotely over the network by replacing 'localhost' with the machine IP.
- You can type a message or choose from a list of presets.
- Add to queue: when you add a message,it should appear in the queue.
- At the END of all details, the message should move to "active" and appear on the display.
- When the next next end is loaded, the message will be dropped from active and the system returns to normal state.
- If there is no message in the queue, default display is "next detail".

### Security

This system is inherently "trusting".  All API endpoints are open across the network in order to allow you to make use of multiple networked machines displaying timers and sending messages as needed across a large and/or complex field of play.  You should be running your timing system on its own, entirely sandboxed, network.  You should not expose your timing system to the whole Internet.  You should not give access to your timing system network to anyone you do not trust.  You are responsible for your own network safety.

### Issues

Please report any bugs or quirks to [neualtournaments@gmail.com](mailto:neualtournaments@gmail.com), or register them in the Issues tab on GitHub.

### Disclaimer

This project is not affiliated with World Archery, or any other international or national governing body for archery.  It is written and released freely under the terms in the LICENSE file.

## License

Better WA-Compatible Timer &copy; 2026 by <a href="mailto:jesse@jessephillips.uk">Jesse Phillips</a> & <a href="mailto:neualtournaments@gmail.com">Philip Taylor</a> is licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a><br /><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">

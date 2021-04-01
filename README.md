# bandy

*bandy* is a multi-user interface for capturing and aggregating user button clicks and plugging them into Magenta Piano Genie for control of MIDI musical instruments. 

Individual player (clients) trigger events by playing a Breakout like game. These events are sent to a database which maintains an array of all player events. A controller retrieves these player events and sends them to the Magenta Piano Genie to generate MIDI data. The MIDI data is routed from the web instance for further filtering (if desired) and then sent to an ensemble of MIDI controlled instruments. 

*bandy* clients should be able to run on phones to allow for playing while viewing a VC call to hear the result of the physical instruments being played.

## Future Features
- Allow for local synthesis of the audio
- Allow for creatable/joinable rooms so you can share the experience with friends

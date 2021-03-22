# PONGSEMBLE

*pongsemble* is a multi-user interface for capturing and aggregating user button clicks and plugging them into piano Genie for control of MIDI musical instruments. 

Individual player (clients) trigger events by playing a Pong like game. These events are sent to a database which maintains an array of all player events. A controller retrieves these player events and sends them to the Magenta Piano Genie to generate MIDI data. The MIDI data is routed from the web instance for further filtering (if desired) and then sent to an ensemble of MIDI controlled instruments. 

*pongsemble* clients should be able to run on phones to allow for playing while viewing a VC call to hear the result of the physical instruments being played.
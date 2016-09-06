Arduino Hackvision Emulator
===========================

Emulates an [Arduino](http://www.arduino.cc) with TV-Out functionality in the browser using HTML5/JavaScript.

It could be used to emulate the [Hackvision](https://nootropicdesign.com/hackvision/) homebrew gaming console. [Wikipedia](https://en.wikipedia.org/wiki/Hackvision)

I have been working on this project in my spare time and currently it's far from perfect but it does emulate the basic [NTSC demo](https://www.youtube.com/watch?v=MEg_V4YZDh0) provided with the [TVout](http://playground.arduino.cc/Main/TVout) Arduino library.

Goal
----

To facilitate graphical program development on the Arduino by using browser based emulation.

Usage
-----

1. Open emulator.html in web browser
2. Paste HEX file into textbox
3. Fill in program constants
4. Click "Load to ROM"
5. Click "Run"

Known issues
------------

 - This emulator has only been tested with the NTSC demo provided with the TVout Arduino library.

 - Requires the user to know the addresses of certain symbols in the program. Specifically;

  1. Framebuffer address
  2. TVout::Delay() address
  3. TVout::delay_frame(unsigned int x) address
  4. analogRead() address
  5. X resolution of graphical output screen
  6. Y resolution of graphical output screen

 - This program has only been tested in Firefox 45.3.0 and performance may vary from browser to browser. See `//Forces more instructions to be executed in a given time. Mileage may vary from browser to browser...` in emulator.html


Demo
----

See the demo at [https://integralprogrammer.github.io/arduino-hackvision-emulator](https://integralprogrammer.github.io/arduino-hackvision-emulator)

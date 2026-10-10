---
slug: fsi-bldc-motor-drive
title: "Florida Space Institute: BLDC Motor Drive for NASA's RE-RASSOR Lunar Rover"
short_title: FSI Lunar Rover Motor Drive
order: 2
featured: true
status: complete
published: true
period: Aug 2025 – Apr 2026
context: UCF Senior Design capstone sponsored by the Florida Space Institute (Fall 2025 – Spring 2026)
role: Embedded Systems Software Engineer
team: [Noah Fourari, Alex Fowler, Nicholas Bernhoft, Gabriel Pullam, Kenneth Arias, Jake Weber]
summary: >-
  Replaced the stepper-motor drivetrain of RE-RASSOR, a variant of NASA's RASSOR lunar excavation rover,
  with a brushless (BLDC) system: about 81% lighter, about 82% lower power per motor, and more torque.
highlights:
  - "Redesigned the rover's drive system around Gimbal 2208 BLDC motors with a custom 3D-printed 4:1 gearbox, cutting drivetrain mass from about 1,560 g to about 296 g (~81%)"
  - "Cut power draw from about 18 W to about 3.2 W per motor (~82%) while raising output torque to 0.65 Nm, versus the original stepper's 0.59 Nm"
  - "Developed and debugged the C/C++ control software, resolving UART serial communication and data-serialization issues between the Le Potato single-board computer (Raspberry Pi–compatible) and the Arduino Mega"
  - "Configured and tested the DRV8313 (SimpleFOC Mini) drivers and wrote diagnostic procedures and a troubleshooting manual for PWM generation, watchdog timers and SSH/TCP communication"
  - "Verified safety behavior: the watchdog disables PWM within 300 ms, the system tolerates brownouts down to 8.5 V, and speed droops only 11% under load (spec: < 15%)"
metrics:
  - {value: "~81%", label: "lighter drivetrain"}
  - {value: "~82%", label: "less power per motor"}
  - {value: "0.65 Nm", label: "output torque (vs 0.59 Nm)"}
  - {value: "< 300 ms", label: "watchdog safety cutoff"}
tech: [C, C++, Arduino, SimpleFOC, DRV8313, Le Potato SBC, UART, SSH/TCP, BLDC motor control, PWM]
links:
  - {label: "Source (BLControl)", url: "https://github.com/NickBernhoft/BLControl"}
cover: media/team-demo-day.jpg
gallery:
  - {src: media/team-demo-day.jpg, alt: "The six-person team with the blue 3D-printed rover and controller software at the UCF senior design showcase",
     caption: "Senior design showcase: the RE-RASSOR rover with the new BLDC drive and the controller software", position: bottom}
youtube:
  - {id: nepobVCOfdU, title: "Florida Space Institute – BLDC Motor Control System"}
documents:
  - {label: "Design document (full report)", url: "https://docs.google.com/document/d/18jwPBWZlARYcJdICGYtKpQXToHpP67AWwITrMt3nIDk/edit?usp=sharing", pages: 146}
---

## Overview

RE-RASSOR (Research and Education Regolith Advanced Surface Systems Operation Robot) is a 3D-printed variant of NASA's RASSOR lunar excavation rover, used by the Florida Space Institute for research and education. Its original stepper-motor drivetrain was heavy and power-hungry. Our six-person UCF senior design team, sponsored by FSI with faculty mentors Mike Conroy and Christian Vincent, designed a new brushless (BLDC) motor control system to replace it.

## My role

I was the team's **embedded systems software engineer**. I finalized the software integration for the BLDC system and kept the control stack working end to end:

- debugged the C/C++ control code and fixed UART serial communication and data-serialization problems between the Le Potato server (a Raspberry Pi–compatible single-board computer) and the Arduino Mega motor controller;
- configured and tested the DRV8313-based SimpleFOC Mini drivers;
- wrote diagnostic procedures and a troubleshooting manual so faults in PWM generation, watchdog timers and SSH/TCP communication can be isolated quickly;
- supported the team's iterative, Agile-style test phases that verified the motor-control logic before final delivery.

## System design

- **Motors:** four Gimbal 2208 90KV BLDC motors, about 39 g each, with Hall-effect sensors for position feedback.
- **Gearing:** a custom 3D-printed 4:1 gearbox per wheel, which recovers torque from the small motors.
- **Drivers:** SimpleFOC Mini boards (TI DRV8313), driven through SimpleFOC's 3-PWM driver class.
- **Control:** an Arduino Mega 2560 runs the motor control loop and receives commands over UART from the networked Le Potato board, which the operator's controller app reaches over the network.
- **Safety:** a watchdog that stops the motors if commands stop arriving, plus brownout tolerance.

## Results

| | Original steppers | New BLDC system |
|---|---|---|
| Drivetrain mass | ~1,560 g | **~296 g** (~81% lighter) |
| Power per motor | ~18 W | **~3.2 W** (~82% lower) |
| Output torque | 0.59 Nm (holding) | **0.65 Nm** (geared) |

The final system also passed safety and load testing: PWM is disabled within 300 ms when commands stop, it keeps running through brownouts down to 8.5 V, and speed droops 11% under load (the requirement was under 15%).

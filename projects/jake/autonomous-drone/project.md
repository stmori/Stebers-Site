---
slug: autonomous-drone
title: "Autonomous Quadcopter Flight-Control Workspace (ROS 2 + Gazebo)"
short_title: Autonomous Drone
order: 6
featured: false
status: in-progress
published: true
period: May 2026 – Present
context: Personal project
role: Sole developer
team: [Jake Weber]
summary: >-
  A simulated quadcopter that flies a full mission (arm, takeoff, hover, cruise, land) and holds position when its
  YOLOv8 vision pipeline spots a person or obstacle. Built as a testbed for flight code headed to real hardware.
highlights:
  - "Built a ROS 2 flight stack in Gazebo whose finite state machine (IDLE → TAKEOFF → HOVER → FORWARD → AVOID → LAND) drives a full autonomous mission"
  - "Integrated a YOLOv8 perception node on the drone's camera stream that interrupts the flight plan and holds position when a person or obstacle is detected"
  - "Wrote a custom PID mixer that turns roll/pitch/thrust setpoints into per-rotor forces, with sonar-based altitude hold and a low-pass IMU filter"
  - "Built a live PID gain tuner (Tkinter, publishing over a ROS topic) and modeled the airframe in URDF/xacro, visualized in RViz2"
metrics:
  - {value: "6", label: "flight states"}
  - {value: "YOLOv8", label: "real-time perception"}
tech: [ROS 2, Gazebo, Python, C++, YOLOv8, OpenCV, PID control, URDF/xacro, RViz2]
links:
  - {label: "Source", url: "https://github.com/Jeber811/Drone-Workspace"}
cover: ""
gallery: []
youtube: []          # simulation flight videos coming
documents: []
---

## Overview

A simulated quadrotor that runs a complete mission profile while reacting in real time to its sensors. It's a testbed for flight-control logic that will later move to a real flight controller (an STM32 target). Each part (perception, control, motor mixing) is its own ROS 2 node, so pieces can be swapped or tested independently.

## How it works

- **Mission logic:** a finite state machine moves through `IDLE → TAKEOFF → HOVER → FORWARD → AVOID → LAND`. Takeoff and hover use sonar altitude feedback, and forward flight commands a pitch attitude setpoint rather than raw velocity.
- **Perception:** a YOLOv8 node processes compressed camera frames and publishes detected targets. When a person or obstacle appears, the state machine interrupts the plan and holds position.
- **Control:** a custom PID mixer turns roll, pitch and thrust setpoints into per-motor forces. An IMU filter node low-passes acceleration and orientation, and a Tkinter tuner adjusts PID gains live while the drone flies.
- **Simulation:** a URDF/xacro airframe with sonar, IMU and camera sensors in a custom Gazebo world, visualized in RViz2.

## Status

**In progress.** The core flight sequence (arm → takeoff → hover → forward → land) and vision-triggered avoidance work in simulation. Current focus: tuning the attitude PID and verifying the forward-flight pitch response. Flight videos will be added here.

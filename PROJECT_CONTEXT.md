# Doors — Project Context

## Purpose

Doors is an interactive, place-based 360° audiovisual experience. Visitors move
among recorded environments, investigate selected features of the landscape, and
encounter sound that changes with location, attention, and viewing direction.

The project should feel exploratory rather than menu-driven. The landscape is the
interface: navigation, information, and sound should appear as parts of the
environment instead of as a conventional website layered over it.

This document records the shared design intent and technical direction. It should
be updated when a major interaction, content, navigation, or architecture decision
changes.

## Experience Principles

- Keep the 360° environment visually primary.
- Use different interaction densities in different spaces; not every area needs
  the same number or type of hotspots.
- Make navigation spatial and understandable without turning the experience into
  a conventional menu.
- Treat sound as responsive material, not only as a background soundtrack.
- Use looking and panning as meaningful input for mixing, revealing, or
  transforming sound.
- Keep interactions discoverable and provide clear hover, focus, selection, and
  transition feedback.
- Preserve a calm, site-specific character. Added interface elements should be
  deliberate and visually restrained.

## Experience Map

The storyboard describes four main spaces plus an entry:

```text
Entry <-> Funnel
          |    \
          |     \
       Lookout <-> Heart
          |         |
          +-> Bottoms <-+
```

The storyboard's arrows appear bidirectional. The exact set of routes should be
confirmed during implementation, because the navigation currently encoded in the
site does not exactly match this map.

### Bottoms — Archive and Knowledge Sharing

Bottoms is the most explicitly informational and object-oriented space. Visitors
point at or select features associated with material such as:

- trail-camera images;
- soundscape compositions;
- plant identification;
- other archival or site-knowledge media.

This is the primary candidate for informational hotspots and in-view content
panels. Hotspots should be tied to meaningful landscape objects rather than
distributed uniformly.

### Lookout — Observation and Context

Lookout is intentionally described as having minimal interaction. It is a
contemplative space that may include:

- a locus or location stream;
- vertical or historical context about the site;
- one or a small number of subtle points of interaction.

The restraint is part of the design. Lookout should not automatically inherit the
interaction density of Bottoms.

### Heart — Generative Resonance

Heart is a spatial, generative music environment. The storyboard shows multiple
resonators, identified as A–D, distributed around the viewer. Its concepts
include:

- resonators associated with physical locations or trees on the site;
- composed sine-wave ratios within a larger musical anatomy;
- sound diffused through resonators tuned to site-derived sound profiles;
- crossfading that follows the visitor's video pan or viewing direction.

The intended interaction is continuous: turning toward and between resonators
changes their relative presence. The visitor's gaze becomes a mixing gesture.

### Funnel — Granular and Convolved Sound Field

Funnel is an enveloping, processed sound environment. The storyboard references:

- a looped stream;
- a raw contact-microphone recording arranged horizontally;
- local impulse-response convolution;
- an encapsulated sonic envelope;
- crossfading that follows the video pan;
- granular deconstruction, described as “intersections of now.”

The circle in the storyboard is interpreted as a sound field surrounding the
visitor. Exact source placement, processing, and terminology need confirmation
before the final audio implementation is specified.

## Interaction Model

There are at least two distinct hotspot types:

1. **Navigation hotspots** move the visitor between spaces.
2. **Information hotspots** reveal text, images, audio, or other contextual media
   without leaving the current space.

These types should have related but distinguishable visual language and behavior.
An information hotspot should never accidentally trigger navigation.

Information content appears within the experience through in-scene A-Frame POIs
and an accessible HTML overlay. This hybrid pattern supports closing, keyboard
focus, touch, and reduced-motion preferences.

Directional or gaze-reactive sound is a third interaction mode. It should respond
continuously to camera orientation and should not require visible hotspots unless
the design of a particular space calls for them.

## Sound Direction

The target sound model is richer than one soundtrack per space. It may combine:

- an ambient bed associated with the current space;
- spatial or directional sources attached to meaningful positions;
- smooth crossfades based on camera direction;
- clips triggered by visitor interaction;
- convolution or granular processing in spaces where the artwork requires it.

Sound must begin only after a clear visitor gesture because browsers block
unprompted audio. The experience should provide a purposeful entry or “begin
listening” action that initializes audio and communicates whether sound is on.

Transitions between spaces should fade or crossfade audio rather than abruptly
stop and restart it. Audio state, loading failures, mute controls, and cleanup
should be managed centrally.

## Technical Direction

### A-Frame as the Presentation Framework

A-Frame remains the primary framework for the 360° scene, camera, entity
placement, raycasting, input, and WebXR-compatible interaction.

JavaScript is expected in an A-Frame project. The architectural goal is not to
eliminate JavaScript, but to move reusable scene behavior into focused A-Frame
components and systems. Direct Three.js access should be reserved for behavior
that A-Frame does not express cleanly, such as specialized audio graphs or custom
rendering.

Likely responsibilities include:

- a scene/navigation system that owns the active space and transitions;
- navigation-hotspot and information-hotspot components;
- a reusable information-panel component or coordinated HTML overlay;
- an audio system that owns initialization, sources, fades, and cleanup;
- a directional-mixer component driven by camera orientation;
- structured configuration describing each space and its content.

### Content Configuration

Scene content should be data-driven rather than embedded as `onClick` functions.
Each space should be able to declare:

- its ID, title, video asset, and initial orientation;
- navigation destinations;
- information hotspots and their content;
- ambient, positional, and directional audio sources;
- any space-specific interaction mode.

This configuration should become the source of truth for both scene construction
and navigation validation.

## Current Implementation

The active prototype is `doors/index.html`, supported primarily by
`js/hotspots.js`.

It currently provides:

- a season selector that keeps the visitor in the same place while switching
  between five Winter 360° videos and five Late Spring panoramic images;
- dynamically created A-Frame navigation hotspots;
- spherical-coordinate hotspot placement;
- per-video orientation;
- an iris-like visual transition between videos;
- one selected HTML audio track per space;
- desktop mouse raycasting.
- configurable in-scene information POIs with accessible text panels;

The current code uses A-Frame entities but coordinates most behavior through one
imperative `HotspotManager`. There is almost no active direct Three.js code; the
main architectural mixture is A-Frame plus page-level JavaScript rather than
A-Frame plus authored Three.js.

Known gaps include:

- initial area audio is blocked by browser autoplay policy;
- information POIs currently support text; image, audio, and archival media are
  not yet implemented;
- area audio restarts abruptly instead of crossfading;
- sound is not yet spatial or direction-responsive;
- interaction is primarily desktop-oriented;
- navigation, hotspot content, and sound mappings are coupled in one file;
- unused prototype components and dependencies remain in the repository;
- the navigation graph needs to be reconciled with the storyboard.

## Near-Term Roadmap

1. Confirm the navigation graph and the intended content in each space.
2. Define a structured configuration for spaces, navigation hotspots,
   information hotspots, and audio sources.
3. Add an intentional entry gesture that initializes audio.
4. Separate navigation hotspots from information hotspots.
5. Prototype one information panel in Bottoms using real content.
6. Centralize audio behavior and add smooth space-to-space crossfades.
7. Prototype directional mixing in Heart with a small set of sound sources.
8. Prototype Funnel's sound processing only after its source material and desired
   processing behavior are confirmed.
9. Test mouse, keyboard, touch, device orientation, reduced motion, muted entry,
   and WebXR expectations according to the agreed device scope.

## Open Decisions

- What is the final bidirectional navigation graph?
- Should information use an in-world A-Frame panel, an accessible HTML overlay,
  or a hybrid?
- Which real Bottoms hotspot should be used for the first content prototype?
- Are mobile orientation and WebXR headset interaction required for the first
  release, or only architectural compatibility?
- Which audio assets belong to each space, and which should be ambient,
  positional, directional, or triggered?
- Are Heart's resonators attached to exact recorded site locations, visible
  objects, abstract directions, or a combination?
- What exact impulse responses, contact recordings, and granular behaviors define
  Funnel?
- Should sound respond only to horizontal pan, or also to vertical look direction?

## Reference

Primary design reference:

- `UX_storyboard.png`, supplied July 27, 2026.

The source image currently lives outside the repository. If it is intended to
remain a durable project reference, add an approved copy under a repository
documentation or design-assets directory and update this link.

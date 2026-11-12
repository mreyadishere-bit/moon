import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundFX } from './audio/AudioManager';
import { ChallengeOverlay } from './challenges/ChallengeOverlay';
import { EmergencyRepair } from './challenges/EmergencyRepair';
import { RescueTasks } from './challenges/RescueTasks';
import { KidFriendlyConsole } from './challenges/KidFriendlyConsole';
import { AdventureAcademy } from './ui/AdventureAcademy';
import { ArrivalCinematic } from './ui/ArrivalCinematic';
import { AdventureState, readAdventure, resetAdventure } from './game/ScienceAdventure';
import { CollisionSystem } from './game/CollisionSystem';
import { InteractionSystem } from './game/InteractionSystem';
import {
  ChallengeId,
  createInitialMissionState,
  MissionStateData,
  RoomId,
} from './game/MissionState';
import { PlayerController } from './game/PlayerController';
import { GameSettings, SaveManager } from './game/SaveManager';
import { SimulationEngine } from './game/SimulationEngine';
import { NovaMessage, StoryDirector } from './narrative/StoryDirector';
import { HUD } from './ui/HUD';
import { GuidebookModal } from './ui/GuidebookModal';
import { MainMenu } from './ui/MainMenu';
import { MissionDebrief } from './ui/MissionDebrief';
import { ScienceModal } from './ui/ScienceModal';
import { SettingsModal } from './ui/SettingsModal';
import { CharacterDialogue, StationCrew } from './characters/StationCrew';
import { PixCompanion } from './characters/PixCompanion';
import { DialogueModal } from './ui/DialogueModal';
import { ObservationModal } from './ui/ObservationModal';
import { Canvas2DRenderer } from './world/Canvas2DRenderer';
import { HabitatBuilder, InteractiveTarget } from './world/HabitatBuilder';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [missionState, setMissionState] = useState<MissionStateData>(() => {
    const initial = createInitialMissionState();
    SimulationEngine.recomputeDerivedState(initial);
    return initial;
  });

  const [inMenu, setInMenu] = useState<boolean>(true);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(() =>
    SaveManager.hasSavedMission()
  );
  const [activeChallenge, setActiveChallenge] = useState<ChallengeId | null>(null);
  const [activeRepair, setActiveRepair] = useState<ChallengeId | null>(null);
  const [advancedConsole, setAdvancedConsole] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);
  const [introCinematic, setIntroCinematic] = useState(false);
  const [cinematicElapsed, setCinematicElapsed] = useState(0);
  const introRef = useRef({active:false,elapsed:0});
  const [showScienceModal, setShowScienceModal] = useState<boolean>(false);
  const [showObservationModal, setShowObservationModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showGuidebookModal, setShowGuidebookModal] = useState<boolean>(false);
  const [guidebookTab, setGuidebookTab] = useState<'mission' | 'map' | 'controls' | 'discoveries' | 'science'>('mission');
  const [activeDialogue, setActiveDialogue] = useState<CharacterDialogue | null>(null);
  const [playerYaw, setPlayerYaw] = useState<number>(0);
  const [playerPosState, setPlayerPosState] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [settings, setSettings] = useState<GameSettings>(() =>
    SaveManager.loadSettings()
  );
  const [focusedTarget, setFocusedTarget] = useState<InteractiveTarget | null>(null);
  const [graphicsUnavailable, setGraphicsUnavailable] = useState(false);
  const [graphicsDiagnostics, setGraphicsDiagnostics] = useState('');
  const [novaMessage, setNovaMessage] = useState<NovaMessage | null>(
    StoryDirector.getOpeningSequence()[0]
  );

  // Mutable refs for the render loop so React state updates never recreate the canvas
  const stateRef = useRef<MissionStateData>(missionState);
  stateRef.current = missionState;

  const inMenuRef = useRef<boolean>(inMenu);
  inMenuRef.current = inMenu;

  const activeModalRef = useRef<boolean>(false);
  activeModalRef.current =
    inMenu ||
    Boolean(activeChallenge) ||
    Boolean(activeRepair) ||
    showAcademy ||
    introCinematic ||
    Boolean(activeDialogue) ||
    showObservationModal ||
    showScienceModal ||
    showSettingsModal ||
    showGuidebookModal ||
    missionState.stormEvaluated;

  const playerRef = useRef<PlayerController | null>(null);
  const focusedTargetRef = useRef<InteractiveTarget | null>(null);
  const pixRef = useRef<PixCompanion | null>(null);
  const previousChapterRef = useRef(1);

  // The first solar-alert chapter shift creates an actual in-game emergency beat.
  useEffect(() => {
    const chapter=missionState.currentChapter;
    if (!inMenu && chapter>=5 && previousChapterRef.current<5 && !missionState.radiation.completed) {
      soundFX.playAlertChime();
      setNovaMessage({id:'solar-alert-scene',speaker:'NOVA',text:'Training alert: space weather is changing. Find the protective shelter and prepare the crew. You have time to think — this is a learning simulation.',priority:'warning'});
    }
    previousChapterRef.current=chapter;
  },[missionState.currentChapter,missionState.radiation.completed,inMenu]);

  // Apply settings to audio and player controller
  useEffect(() => {
    soundFX.setVolume(settings.audioVolume, settings.muted);
    if (playerRef.current) {
      playerRef.current.sensitivity = settings.mouseSensitivity;
    }
    SaveManager.saveSettings(settings);
  }, [settings]);

  // Enable/disable first-person movement when menus/consoles open
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setEnabled(!activeModalRef.current);
    }
  }, [inMenu, activeChallenge, activeRepair, showAcademy, introCinematic, activeDialogue, showObservationModal, showScienceModal, showSettingsModal, showGuidebookModal, missionState.stormEvaluated]);

  const updateMissionState = useCallback(
    (
      updater: (draft: MissionStateData) => void,
      logAction?: { system: string; action: string; impact: string }
    ) => {
      setMissionState((prev) => {
        const next: MissionStateData = JSON.parse(JSON.stringify(prev));
        updater(next);
        if (logAction) {
          const hrs = Math.floor(next.telemetry.missionHoursRemaining);
          const mins = Math.floor((next.telemetry.missionHoursRemaining - hrs) * 60);
          next.decisions.push({
            timestampMissionHr: `T-${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
            system: logAction.system,
            action: logAction.action,
            scientificImpact: logAction.impact,
          });
        }
        SimulationEngine.recomputeDerivedState(next);
        SaveManager.saveMission(next);
        stateRef.current = next;
        return next;
      });
    },
    []
  );

  const handlePhysicalInteract = useCallback(
    (target: InteractiveTarget | null) => {
      const t = target || focusedTargetRef.current;
      if (!t) return; // Interaction must always target a nearby object, never open a random console.

      // Chapter 1 special interaction: Restoring main power from the hub console
      if (t.id === 'console_hub' && !stateRef.current.stationLightsOn) {
        soundFX.playSuccessChord();
        updateMissionState(
          (d) => {
            d.stationLightsOn = true;
            d.currentChapter = 2;
          },
          {
            system: 'Main Hub Terminal',
            action: 'Brought LUNA-7 Out of Emergency Standby',
            impact: 'Restored primary habitat lighting and navigation systems.',
          }
        );
        setNovaMessage({
          id: 'nova-power-restored',
          speaker: 'NOVA',
          text: 'Perfect! You just brought the main systems online. But Maya is sheltered in the radiation module, and our batteries are running low. Follow the glowing floor path to the Power Room (North).',
          priority: 'success',
        });
        return;
      }

      if (t.actionType === 'academy') {
        soundFX.playClick(660);
        setShowAcademy(true);
        pixRef.current?.say('Come on! Let’s run a science experiment!', 3);
        return;
      }

      if (t.actionType === 'observation') {
        soundFX.playClick(670);
        setShowObservationModal(true);
        return;
      }

      if (t.actionType === 'dialogue' && t.characterId) {
        soundFX.playClick(640);
        const dialogue = StationCrew.getCharacterDialogue(
          t.characterId,
          stateRef.current.currentChapter
        );
        // Real branching consequence: the crew remembers what the player did in
        // the Science Academy rather than repeating a disconnected NPC script.
        const training = readAdventure();
        const powerChoice = training.choices.find(c => c.stage === 2)?.id;
        const greenhouseChoice = training.choices.find(c => c.stage === 4)?.id;
        const stormChoice = training.choices.find(c => c.stage === 5)?.id;
        if (t.characterId === 'leo' && powerChoice) {
          dialogue.lines.push(powerChoice === 'breathe'
            ? 'I saw you choose the air machines first. Good thinking about the crew — but watch our battery too!'
            : powerChoice === 'grow'
              ? 'You gave the plants extra light! That helps our garden, but now let’s check how much electricity we have left.'
              : 'I noticed you saved some battery power earlier. Having a backup is a smart engineering choice.');
        }
        if (t.characterId === 'sprout' && greenhouseChoice) {
          dialogue.lines.push(greenhouseChoice === 'recycle'
            ? 'You fixed the water-recycling plan! Less waste means more water for our little green friends.'
            : 'Our lights are shining brightly thanks to you! Just remember that grow lights need electricity.');
        }
        if (t.characterId === 'maya' && stormChoice) {
          dialogue.lines.push(stormChoice === 'shelter'
            ? 'Thank you for preparing the shelter. When conditions might be dangerous, crew safety comes first.'
            : 'You checked the instruments. That helps us understand an alert, but monitoring is not a substitute for shelter preparedness.');
        }
        setActiveDialogue(dialogue);
        pixRef.current?.say(`Talking to ${dialogue.speaker}!`, 3);
        return;
      }

      if (t.actionType === 'open_challenge' && t.challengeId) {
        soundFX.playClick(680);
        const repaired = stateRef.current.decisions.some((entry) => entry.system === 'Mini-game repair' && entry.action === t.challengeId);
        if (repaired) { setAdvancedConsole(false); setActiveChallenge(t.challengeId); }
        else setActiveRepair(t.challengeId);
        return;
      }

      soundFX.playSwitchMechanical();
      if (t.id === 'switch_power_dust') {
        updateMissionState(
          (d) => {
            d.power.dustCleared = !d.power.dustCleared;
            d.power.busbarBalanced = true;
          },
          {
            system: 'Power Core (3D Breaker)',
            action: 'Pulsed Electrostatic Dust Breaker & Tied Busbars',
            impact: 'Cleared lunar dust occlusion on Solar Array Bus A.',
          }
        );
        setNovaMessage({
          id: 'nova-dust',
          speaker: 'NOVA',
          text: 'Electrostatic dust curtain energized! Solar busbar tied. Open the Power Console to complete panel alignment.',
          priority: 'success',
        });
      } else if (t.id === 'switch_lifesupport_valve') {
        updateMissionState(
          (d) => {
            d.lifeSupport.airflowDamperOpen = true;
            d.lifeSupport.zeoliteBedPurged = true;
            d.lifeSupport.backupO2ValveCycled = true;
          },
          {
            system: 'Life Support (3D Valve)',
            action: 'Opened Airflow Damper & Initiated Zeolite Thermal Purge',
            impact: 'Restored cabin duct circulation and desorbed CO₂ bed.',
          }
        );
        setNovaMessage({
          id: 'nova-valve',
          speaker: 'NOVA',
          text: 'Airflow damper open and Zeolite filtration purged! Now adjust fans and O₂ levels at the Life Support Console.',
          priority: 'success',
        });
      } else if (t.id === 'switch_radiation_latch') {
        updateMissionState(
          (d) => {
            d.radiation.stormShutterClosed = true;
            d.radiation.bulkheadLatched = !d.radiation.bulkheadLatched;
          },
          {
            system: 'Radiation Shelter (3D Latch)',
            action: 'Deployed External Storm Shutter & Hydraulic Bulkhead Latch',
            impact: 'Locked structural radiation shield bay over South Bulkhead.',
          }
        );
        setNovaMessage({
          id: 'nova-latch',
          speaker: 'NOVA',
          text: 'Hydraulic storm bulkhead locked! Configure the 3-layer protective shielding at the Radiation Console.',
          priority: 'success',
        });
      } else if (t.id === 'switch_greenhouse_valve') {
        updateMissionState(
          (d) => {
            d.greenhouse.condensateLoopClosed = !d.greenhouse.condensateLoopClosed;
          },
          {
            system: 'Greenhouse (3D Manifold)',
            action: 'Closed Transpiration Condensate Recovery Manifold',
            impact: 'Reclaimed 96% of transpired plant water vapor into potable storage.',
          }
        );
        setNovaMessage({
          id: 'nova-cond',
          speaker: 'NOVA',
          text: 'Condensate recovery loop closed! Now tune irrigation and grow lighting at the Hydroponics Console.',
          priority: 'success',
        });
      }
    },
    [updateMissionState]
  );

  // Global keyboard shortcuts (E to interact, J for guidebook, M for map, H for guide trail, Escape for menu)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (introCinematic) {
          introRef.current.active=false;
          setIntroCinematic(false);
        } else if (showAcademy) {
          setShowAcademy(false);
        } else if (activeRepair) {
          setActiveRepair(null);
        } else if (showObservationModal) {
          setShowObservationModal(false);
        } else if (activeDialogue) {
          setActiveDialogue(null);
        } else if (showGuidebookModal) {
          setShowGuidebookModal(false);
        } else if (activeChallenge) {
          setActiveChallenge(null);
        } else if (showScienceModal) {
          setShowScienceModal(false);
        } else if (showSettingsModal) {
          setShowSettingsModal(false);
        } else if (!inMenu && !stateRef.current.stormEvaluated) {
          setShowSettingsModal(true);
        }
      } else if (e.code === 'KeyE' && !activeModalRef.current) {
        handlePhysicalInteract(focusedTargetRef.current);
      } else if (e.code === 'KeyJ' && !inMenu && !stateRef.current.stormEvaluated) {
        setShowGuidebookModal((prev) => !prev);
        setGuidebookTab('mission');
        soundFX.playClick(620);
      } else if (e.code === 'KeyM' && !inMenu && !stateRef.current.stormEvaluated) {
        setShowGuidebookModal(true);
        setGuidebookTab('map');
        soundFX.playClick(620);
      } else if (e.code === 'KeyH' && !inMenu && !stateRef.current.stormEvaluated) {
        updateMissionState((d) => {
          d.guideTrailActive = !(d.guideTrailActive ?? true);
        });
        soundFX.playClick(520);
      } else if (e.code === 'F3') {
        window.dispatchEvent(new CustomEvent('toggle-collision-debug'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeChallenge,
    activeRepair,
    showAcademy,
    introCinematic,
    activeDialogue,
    showObservationModal,
    showScienceModal,
    showSettingsModal,
    showGuidebookModal,
    inMenu,
    handlePhysicalInteract,
    updateMissionState,
  ]);

  // Initialize 3D Scene (Three.js WebGLRenderer with automatic Canvas2DRenderer fallback if WebGL is disabled in browser)
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const camera = new THREE.PerspectiveCamera(
      68,
      window.innerWidth / window.innerHeight,
      0.1,
      220
    );
    const collision = new CollisionSystem();
    const interaction = new InteractionSystem();

    let renderer: THREE.WebGLRenderer | null = null;
    let habitat: HabitatBuilder | null = null;
    let fallback2D: Canvas2DRenderer | null = null;
    let activeCanvas: HTMLCanvasElement;

    // A WebGL initialization failure must not silently masquerade as the real game.
    // Retry with progressively more compatible settings before using the 2D diagnostic view.
    let rendererError = '';
    for (const options of [
      { antialias: true, powerPreference: 'high-performance' as const },
      { antialias: false, powerPreference: 'default' as const },
      { antialias: false, powerPreference: 'low-power' as const },
    ]) {
      try {
        const candidate = new THREE.WebGLRenderer({
          ...options, alpha: false, stencil: false, depth: true,
          failIfMajorPerformanceCaveat: false,
        });
        candidate.outputColorSpace = THREE.SRGBColorSpace;
        candidate.toneMapping = THREE.ACESFilmicToneMapping;
        candidate.toneMappingExposure = 1.0;
        candidate.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        candidate.setSize(window.innerWidth, window.innerHeight);
        candidate.shadowMap.enabled = true;
        candidate.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer = candidate;
        break;
      } catch (error) {
        rendererError = error instanceof Error ? error.message : String(error);
      }
    }
    if (renderer) {
      activeCanvas = renderer.domElement;
    } else {
      activeCanvas = document.createElement('canvas');
      const support = (() => {
        try {
          const probe = document.createElement('canvas');
          return probe.getContext('webgl2') ? 'WebGL2 detected; renderer failed' : probe.getContext('webgl') ? 'WebGL1 only' : 'WebGL unavailable';
        } catch { return 'WebGL initialization blocked'; }
      })();
      setGraphicsDiagnostics([support, rendererError].filter(Boolean).join(' — '));
      setGraphicsUnavailable(true);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090f);
    // Vacuum has negligible atmospheric scattering. No fantasy lunar fog; depth comes from lighting and geometry.
    scene.fog = null;

    if (renderer) {
      // Real GPU gets the full art direction; a SwiftShader/llvmpipe context
      // uses low-cost shading and geometry to avoid locking up the browser.
      const gl = renderer.getContext();
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      const gpuName = String(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      const softwareRendering = /swiftshader|llvmpipe|softpipe|software raster|mesa offscreen/i.test(gpuName);
      if (softwareRendering) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.85));
        renderer.setSize(window.innerWidth, window.innerHeight);
      } else {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        pmremGenerator.dispose();
      }

      habitat = new HabitatBuilder(scene, renderer, softwareRendering);
      const pix = new PixCompanion(scene);
      pixRef.current = pix;
      if (!softwareRendering) renderer.compile(scene, camera);
    } else {
      // Browser has WebGL completely disabled: use 3D-projected Canvas2DRenderer
      fallback2D = new Canvas2DRenderer(activeCanvas);
      fallback2D.setSize(window.innerWidth, window.innerHeight);
    }

    container.innerHTML = '';
    container.appendChild(activeCanvas);

    const player = new PlayerController(camera, activeCanvas, collision);
    playerRef.current = player;

    const interactivesList = habitat
      ? habitat.interactives
      : fallback2D!.interactives;

    const clock = new THREE.Clock();
    let frameId = 0;
    let uiSyncAccumulator = 0;

    function tick() {
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const currentState = stateRef.current;

      if (inMenuRef.current) {
        camera.position.set(
          Math.sin(elapsed * 0.18) * 1.8,
          1.95,
          3.4 + Math.cos(elapsed * 0.18) * 0.6
        );
        camera.lookAt(1.2, 1.5, -6.0);
      } else {
        const detectedRoom = player.update(dt);
        if (pixRef.current) {
          pixRef.current.update(dt, player.position, player.yaw);
        }
        if (detectedRoom !== currentState.currentRoom) {
          currentState.currentRoom = detectedRoom;
          pixRef.current?.reactToRoom(detectedRoom);
          const roomMsg = StoryDirector.getRoomEntryLine(
            detectedRoom,
            currentState
          );
          if (roomMsg) {
            setNovaMessage(roomMsg);
          }
        }

        const target = interaction.findFocusedTarget(camera, interactivesList);
        if (target?.id !== focusedTargetRef.current?.id) {
          focusedTargetRef.current = target;
          setFocusedTarget(target);
        }

        // Learning, dialogue and repair overlays pause mission time and resource drain.
        // Children must not lose the habitat merely because they are reading instructions.
        if (!activeModalRef.current) SimulationEngine.step(currentState, dt);
        uiSyncAccumulator += dt;
        if (uiSyncAccumulator >= 0.1) {
          uiSyncAccumulator = 0;
          setPlayerYaw(player.yaw);
          setPlayerPosState({ x: player.position.x, z: player.position.z });
          setMissionState({
            ...currentState,
            telemetry: { ...currentState.telemetry },
          });
        }
      }

      if (renderer && habitat) {
        // A real in-engine shot of the SAME 3D world, not a fake pre-rendered splash.
        // Camera glides from a wide view of the habitat to the player's start position.
        if (introRef.current.active && !inMenuRef.current) {
          const elapsedIntro=introRef.current.elapsed=Math.min(10.2,introRef.current.elapsed+dt);
          const p=THREE.MathUtils.smoothstep(elapsedIntro/10.2,0,1);
          camera.position.set(THREE.MathUtils.lerp(4.5,0,p),THREE.MathUtils.lerp(2.65,1.7,p),THREE.MathUtils.lerp(5.1,3.6,p));
          camera.lookAt(0,1.45,-0.4);
          if(Math.round(elapsedIntro*10)%3===0) setCinematicElapsed(elapsedIntro);
          if(elapsedIntro>=10.2){
            introRef.current.active=false;
            setIntroCinematic(false);
            setNovaMessage({id:'pix-first-steps',speaker:'NOVA',text:'Welcome, explorer! Activate the hub table or visit the Science Academy on the wall. PIX will be your guide.',priority:'normal'});
          }
        }
        habitat.update(dt, player.position, currentState);
        // Synchronize animated door opening factors to physical collision system
        habitat.doors.forEach((door, idx) => {
          collision.setDoorOpenFactor(idx, door.openFactor);
        });
        renderer.render(scene, camera);
      } else if (fallback2D) {
        fallback2D.render(camera, currentState, elapsed);
      }

      frameId = requestAnimationFrame(tick);
    }

    // Toggleable collision debug wireframe mesh group (F3)
    let debugGroup: THREE.Group | null = null;
    const onToggleDebug = () => {
      if (!scene || !collision) return;
      if (debugGroup) {
        scene.remove(debugGroup);
        debugGroup = null;
      } else {
        debugGroup = collision.createDebugVisualizationGroup();
        scene.add(debugGroup);
      }
    };
    window.addEventListener('toggle-collision-debug', onToggleDebug);

    tick();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      if (fallback2D) {
        fallback2D.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('toggle-collision-debug', onToggleDebug);
      player.dispose();
      renderer?.dispose();
    };
  }, []);

  const handleStartNewMission = () => {
    const fresh = createInitialMissionState();
    fresh.started = true;
    SimulationEngine.recomputeDerivedState(fresh);
    SaveManager.saveMission(fresh);
    stateRef.current = fresh;
    setMissionState(fresh);
    setHasSavedGame(true);
    setActiveChallenge(null);
    setActiveRepair(null);
    setAdvancedConsole(false);
    resetAdventure();
    setShowAcademy(false);
    introRef.current={active:true,elapsed:0};
    setCinematicElapsed(0);
    setIntroCinematic(true);
    setShowObservationModal(false);
    setNovaMessage(StoryDirector.getOpeningSequence()[0]);
    playerRef.current?.teleportToRoom('hub');
    setInMenu(false);
  };

  const handleContinueMission = () => {
    introRef.current.active=false;
    setIntroCinematic(false);
    const saved = SaveManager.loadMission();
    if (saved) {
      saved.started = true;
      stateRef.current = saved;
      setMissionState(saved);
      playerRef.current?.teleportToRoom(saved.currentRoom);
      setInMenu(false);
    } else {
      handleStartNewMission();
    }
  };

  const handleTeleportToRoom = (room: RoomId) => {
    playerRef.current?.teleportToRoom(room);
    updateMissionState((d) => {
      d.currentRoom = room;
    });
    const line = StoryDirector.getRoomEntryLine(room, stateRef.current);
    if (line) setNovaMessage(line);
  };

  const handleTriggerFinalStorm = () => {
    setActiveChallenge(null);
    updateMissionState((d) => {
      SimulationEngine.evaluateFinalStormTransit(d);
    });
  };

  const ActiveRepairView = activeRepair === 'power' || activeRepair === 'master_console' ? EmergencyRepair : RescueTasks;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#101820] select-none">
      {/* Dedicated Canvas Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full z-0"
      />

      {graphicsUnavailable && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="graphics-warning-title" className="absolute inset-0 z-[100] flex items-center justify-center bg-[#060b13]/90 p-5 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-[#76AEC9]/40 bg-[#15232f] p-7 text-[#E7E9E6] shadow-2xl">
            <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-[#76AEC9]">MOONSHIFT · GRAPHICS CHECK</div>
            <h2 id="graphics-warning-title" className="mb-3 text-2xl font-bold">Full 3D graphics couldn't start</h2>
            <p className="mb-4 leading-relaxed text-[#ced5db]">
              Your browser could not create a WebGL graphics context. The blue outlines behind this message are a simplified fallback, <strong>not the actual 3D game</strong>. No game progress has been lost.
            </p>
            <ol className="mb-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#ced5db]">
              <li>Turn on <strong>graphics acceleration</strong> in your browser settings, then restart the browser.</li>
              <li>Update your graphics driver and browser, or try another modern browser.</li>
              <li>If you're using Remote Desktop, a virtual machine or a restricted device, enable WebGL/GPU support.</li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-[#76AEC9] px-5 py-3 font-semibold text-[#101820] hover:bg-[#a1d2e8]">Retry 3D</button>
              <button type="button" onClick={() => { setGraphicsUnavailable(false); }} className="rounded-lg border border-[#76AEC9]/40 px-5 py-3 font-semibold text-[#E7E9E6] hover:bg-[#233746]">Continue in basic mode</button>
            </div>
            <p className="mt-5 break-words text-xs text-[#96a8b6]">Diagnostic: {graphicsDiagnostics || 'No WebGL context available'}</p>
          </div>
        </div>
      )}

      {showObservationModal && <ObservationModal onClose={() => setShowObservationModal(false)} />}

      {/* Main Menu Overlay */}
      {inMenu && (
        <MainMenu
          hasSavedGame={hasSavedGame}
          onStartNew={handleStartNewMission}
          onContinue={handleContinueMission}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenScience={() => setShowScienceModal(true)}
        />
      )}

      {!inMenu && !missionState.stormEvaluated && !showAcademy && (
        <button type="button" onClick={() => setShowAcademy(true)}
          className="fixed bottom-5 left-5 z-30 rounded-2xl border border-[#9ecddc]/55 bg-[#0e2636]/90 px-4 py-3 text-sm font-semibold text-[#e5f4f9] shadow-xl backdrop-blur-md transition hover:border-[#d0e9f1] hover:bg-[#24475c]"
          title="Continue the interactive NASA science adventure">
          ✦ Story & Science Academy
        </button>
      )}
      {showAcademy && (
        <AdventureAcademy
          onClose={() => setShowAcademy(false)}
          onExplore={() => { setShowAcademy(false); setNovaMessage({id:'academy-explore',speaker:'NOVA',text:'Great work, explorer! Now try fixing real systems in the 3D station. Follow the glowing floor trail and talk to our crew.',priority:'success'}); }}
          onDecision={(stage:number,choice:string,training:AdventureState) => {
            const key = 'lesson-' + stage;
            if (stateRef.current.decisions.some(entry => entry.system === 'Science Academy' && entry.action.startsWith(key + ':'))) return;
            updateMissionState((d) => {
              if(stage===0) {
                if(choice==='energy')d.telemetry.batteryKwh=Math.max(15,d.telemetry.batteryKwh-7);
                if(choice==='air')d.telemetry.oxygenReservePct=Math.max(50,d.telemetry.oxygenReservePct-10);
              }
              if(stage===2) {
                if(choice==='breathe'){d.power.eclssAllocationKw=6;d.power.greenhouseAllocationKw=3.5;}
                if(choice==='grow'){d.power.greenhouseAllocationKw=5.5;d.power.eclssAllocationKw=4.5;}
                if(choice==='store'){d.power.greenhouseAllocationKw=3.5;d.power.eclssAllocationKw=4.5;}
              }
              if(stage===3) {
                if(choice==='scrub')d.power.eclssAllocationKw=Math.max(6,d.power.eclssAllocationKw);
                if(choice==='rest')d.power.eclssAllocationKw=3.5;
              }
              if(stage===4) {
                if(choice==='recycle')d.greenhouse.dripIrrigationLitersHr=2;
                if(choice==='lights')d.power.greenhouseAllocationKw=5.5;
              }
              if(stage===5 && choice==='shelter') d.power.radiationAllocationKw=2;
              if(stage===6 && choice==='ask') d.telemetry.batteryKwh=Math.max(0,d.telemetry.batteryKwh-1);
            },{system:'Science Academy',action:key + ':' + choice,impact:'Training decision changed the 3D habitat allocation. Educational model result: battery '+training.batteryKwh.toFixed(1)+' kWh, air '+training.air+', shelter '+training.safety+'.'});
            // Chapters are adventures, not seven slides in a row. Return to the
            // explorable habitat for the next discovery, while keeping Academy accessible.
            if (stage < 6) {
              setShowAcademy(false);
              const prompts=[
                'Mission chosen! Look around the hub. PIX can guide you to the next science discovery.',
                'Amazing! Gravity works differently on the Moon. Next, find Leo near the Power Core and learn about solar panels.',
                'Your energy decision changed the habitat. See which machines grew brighter — then investigate our air system!',
                'You repaired the air strategy! SPROUT is waiting in the Greenhouse. Let’s find out what plants need.',
                'Our garden has a plan. Follow the trail to the Radiation Shelter and prepare for the next event.',
                'Shelter plan noted. Return to the hub and learn how radio signals travel through space.'
              ];
              setNovaMessage({id:'lesson-world-'+stage,speaker:'NOVA',text:prompts[stage],priority:'normal'});
            }
          }}
        />
      )}

      {introCinematic && !inMenu && (
        <ArrivalCinematic elapsed={cinematicElapsed} onSkip={()=>{introRef.current.active=false;setIntroCinematic(false);setNovaMessage({id:'pix-after-intro',speaker:'NOVA',text:'Welcome! Follow the light trail to wake the station. Visit the Science Academy on the hub wall and meet PIX.',priority:'normal'});}}/>
      )}

      {/* In-Game HUD Overlay */}
      {!inMenu && !introCinematic && !missionState.stormEvaluated && (
        <HUD
          state={missionState}
          focusedTarget={focusedTarget}
          novaMessage={novaMessage}
          playerYaw={playerYaw}
          onInteract={() => handlePhysicalInteract(focusedTarget)}
          onOpenGuidebook={(tab) => {
            setGuidebookTab(tab || 'mission');
            setShowGuidebookModal(true);
          }}
          onToggleGuideTrail={() => {
            updateMissionState((d) => {
              d.guideTrailActive = !(d.guideTrailActive ?? true);
            });
            soundFX.playClick(520);
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
          onReturnToMenu={() => setInMenu(true)}
          onDismissNovaMessage={() => setNovaMessage(null)}
        />
      )}

      {/* In-Game Astronaut Field Journal & Guidebook */}
      {showGuidebookModal && (
        <GuidebookModal
          state={missionState}
          playerPos={playerPosState}
          initialTab={guidebookTab}
          onClose={() => setShowGuidebookModal(false)}
          onOpenAcademy={() => { setShowGuidebookModal(false); setShowAcademy(true); }}
          onTeleportToRoom={handleTeleportToRoom}
        />
      )}

      {/* Crew Character Interactive Dialogue */}
      {activeDialogue && (
        <DialogueModal
          dialogue={activeDialogue}
          onClose={() => setActiveDialogue(null)}
        />
      )}

      {/* Each system uses a distinct original, child-friendly physical repair task. */}
      {activeRepair && (
        <ActiveRepairView
          challengeId={activeRepair}
          onClose={() => setActiveRepair(null)}
          onComplete={() => {
            const completed = activeRepair;
            updateMissionState((draft) => {}, {
              system: 'Mini-game repair',
              action: completed,
              impact: 'Restored the educational system connection before evaluating resource trade-offs.',
            });
            setActiveRepair(null);
            setAdvancedConsole(false);
            setActiveChallenge(completed);
            setNovaMessage({ id: 'repair-' + completed, speaker: 'NOVA', text: 'Great work! The equipment is connected. Now let\'s check how this system affects the rest of our Moon base.', priority: 'success' });
            soundFX.playSuccessChord();
          }}
        />
      )}

      {/* Child-first mission controls; expert simulation remains available on request. */}
      {activeChallenge && (advancedConsole
        ? <><ChallengeOverlay
            challengeId={activeChallenge}
            state={missionState}
            onUpdateState={updateMissionState}
            onClose={() => {setActiveChallenge(null);setAdvancedConsole(false);}}
            onTriggerFinalStorm={handleTriggerFinalStorm}
          />
          <button type="button" onClick={()=>setAdvancedConsole(false)} className="fixed bottom-5 left-5 z-[70] rounded-xl border border-[#a8d3df] bg-[#153a4e] px-4 py-3 text-sm font-bold text-white hover:bg-[#286079]">← Junior mode</button>
          </>
        : <KidFriendlyConsole
            challengeId={activeChallenge}
            state={missionState}
            onUpdateState={updateMissionState}
            onClose={() => setActiveChallenge(null)}
            onTriggerFinalStorm={handleTriggerFinalStorm}
            onOpenAdvanced={() => setAdvancedConsole(true)}
          />
      )}

      {/* Final Mission Debrief */}
      {missionState.stormEvaluated && (
        <MissionDebrief
          state={missionState}
          onRestart={handleStartNewMission}
          onContinueExploring={() => {
            updateMissionState((d) => {
              d.stormEvaluated = false;
              d.ending = 'none';
              d.telemetry.missionHoursRemaining = 6.0;
            });
          }}
          onOpenScience={() => setShowScienceModal(true)}
        />
      )}

      {/* NASA Science & Sources Modal */}
      {showScienceModal && (
        <ScienceModal onClose={() => setShowScienceModal(false)} />
      )}

      {/* Settings & Accessibility Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={setSettings}
          onResetMission={handleStartNewMission}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}

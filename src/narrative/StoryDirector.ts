import { ChallengeId, MissionChapter, MissionStateData, RoomId } from '../game/MissionState';

export interface NovaMessage {
  id: string;
  speaker: 'NOVA' | 'DR. MAYA CHEN';
  text: string;
  subtext?: string;
  priority: 'normal' | 'warning' | 'success';
}

export interface ChapterObjective {
  chapter: MissionChapter;
  chapterTitle: string;
  title: string;
  detail: string;
  targetRoom: RoomId;
  targetInteractiveId: string;
  trailColor: string;
  completed: boolean;
}

export class StoryDirector {
  public static getOpeningSequence(): NovaMessage[] {
    return [
      {
        id: 'intro-1',
        speaker: 'NOVA',
        text: 'Hello? There you are! Welcome to LUNA-7. I wish we had met under better circumstances.',
        subtext:
          'I’m NOVA, the station computer. Dr. Maya is safe, but we lost contact with her. See that glowing table? Walk over and press E. Let’s bring our home back to life.',
        priority: 'warning',
      },
    ];
  }

  public static getCurrentObjective(state: MissionStateData): ChapterObjective {
    // Chapter 1: The Silent Station (Boot main station power)
    if (!state.stationLightsOn) {
      return {
        chapter: 1,
        chapterTitle: 'CHAPTER 1 · THE SILENT STATION',
        title: 'Find the glowing table and wake up LUNA-7.',
        detail: 'The lights are low and the base is waiting for you. Go to the glowing table and press E.',
        targetRoom: 'hub',
        targetInteractiveId: 'console_hub',
        trailColor: '#76AEC9',
        completed: false,
      };
    }

    // Chapter 2: The Power Failure (North Wing - Power Core)
    if (!state.power.completed) {
      return {
        chapter: 2,
        chapterTitle: 'CHAPTER 2 · THE POWER FAILURE',
        title: 'Follow the golden lights. Let’s find more power!',
        detail: 'Our batteries are running low. Meet Leo and find out how sunlight powers our Moon home.',
        targetRoom: 'power',
        targetInteractiveId: 'console_power',
        trailColor: '#E8AD66',
        completed: false,
      };
    }

    // Chapter 3: A Breath of Fresh Air (East Wing - Life Support)
    if (!state.lifeSupport.completed) {
      return {
        chapter: 3,
        chapterTitle: 'CHAPTER 3 · A BREATH OF FRESH AIR',
        title: 'Follow the blue lights to the air machines.',
        detail: 'We can’t open a window on the Moon! Let’s find out how our machines keep the air safe.',
        targetRoom: 'lifesupport',
        targetInteractiveId: 'console_lifesupport',
        trailColor: '#76AEC9',
        completed: false,
      };
    }

    // Chapter 4: The Green Room (West Wing - Greenhouse)
    if (!state.greenhouse.completed) {
      return {
        chapter: 4,
        chapterTitle: 'CHAPTER 4 · THE GREEN ROOM',
        title: 'Follow the green lights to the space garden.',
        detail: 'Meet SPROUT. Plants need light and water, and both are precious here. Can you help?',
        targetRoom: 'greenhouse',
        targetInteractiveId: 'console_greenhouse',
        trailColor: '#77B89A',
        completed: false,
      };
    }

    // Chapter 5: Before the Storm (South Wing - Radiation Shelter)
    if (!state.radiation.completed) {
      return {
        chapter: 5,
        chapterTitle: 'CHAPTER 5 · BEFORE THE STORM',
        title: 'Follow the red lights. The shelter needs us.',
        detail: 'Particles from the Sun can be dangerous. Let’s help prepare a safer place to wait.',
        targetRoom: 'radiation',
        targetInteractiveId: 'console_radiation',
        trailColor: '#DE6F60',
        completed: false,
      };
    }

    // Final Chapter: The Last Signal (Hub Master Console)
    return {
      chapter: 6,
      chapterTitle: 'FINAL CHAPTER · THE LAST SIGNAL',
      title: 'Back to the glowing table. It’s time to call Maya!',
      detail: 'You’ve learned how the station works. Can all the systems share enough resources?',
      targetRoom: 'hub',
      targetInteractiveId: 'console_hub',
      trailColor: '#76AEC9',
      completed: state.stormEvaluated,
    };
  }

  public static getRoomEntryLine(room: RoomId, state: MissionStateData): NovaMessage | null {
    if (!state.stationLightsOn) {
      return {
        id: 'entry-lights-off',
        speaker: 'NOVA',
        text: 'The station is running on emergency batteries. Turn on the main console in the center first.',
        priority: 'warning',
      };
    }

    switch (room) {
      case 'planetarium':
        return { id:'enter-planetarium', speaker:'NOVA', text:'Welcome to our Planetary Observatory! Compare the planets, try the gravity drop lab, and see how long sunlight travels through space.', subtext:'Explore the orbital model and press E at the Planet Explorer console.', priority:'normal' };
      case 'power':
        if (!state.power.completed) {
          return {
            id: 'enter-power',
            speaker: 'NOVA',
            text: 'Here is the Power Core. Moon dust is covering our solar panels outside and draining our battery.',
            subtext: 'Inspect the Power Console ahead to clear the dust and link the batteries.',
            priority: 'warning',
          };
        }
        return {
          id: 'enter-power-ok',
          speaker: 'NOVA',
          text: 'Power is flowing beautifully! Solar generation is charging our batteries at full capacity.',
          priority: 'success',
        };

      case 'lifesupport':
        if (!state.lifeSupport.completed) {
          return {
            id: 'enter-eclss',
            speaker: 'NOVA',
            text: 'Life Support room. The carbon dioxide levels are rising. We need to clear the filters and start the fans.',
            subtext: 'Step up to the Life Support Console to restore fresh air flow.',
            priority: 'warning',
          };
        }
        return {
          id: 'enter-eclss-ok',
          speaker: 'NOVA',
          text: 'Air circulation is nominal! Oxygen is fresh and CO₂ levels have dropped back to safe levels.',
          priority: 'success',
        };

      case 'greenhouse':
        if (!state.greenhouse.completed) {
          return {
            id: 'enter-gh',
            speaker: 'NOVA',
            text: 'Welcome to the Greenhouse. These plants are our living ecosystem. The irrigation line has paused.',
            subtext: 'Use the Hydroponic Console to restore water flow and tune the warm LED spectrum.',
            priority: 'warning',
          };
        }
        return {
          id: 'enter-gh-ok',
          speaker: 'NOVA',
          text: 'The plants are vibrant again! Transpired water vapor is being 96% reclaimed.',
          priority: 'success',
        };

      case 'radiation':
        if (!state.radiation.completed) {
          return {
            id: 'enter-rad',
            speaker: 'NOVA',
            text: 'This is the Radiation Shelter where Maya is waiting. The solar particle event is getting closer.',
            subtext: 'Configure the shielding layers at the Radiation Console to block incoming solar radiation.',
            priority: 'warning',
          };
        }
        return {
          id: 'enter-rad-ok',
          speaker: 'NOVA',
          text: 'Shelter prepared. The new protection can lower risk during the incoming event.',
          priority: 'success',
        };

      case 'hub':
      default:
        if (
          state.power.completed &&
          state.lifeSupport.completed &&
          state.radiation.completed &&
          state.greenhouse.completed
        ) {
          return {
            id: 'enter-hub-ready',
            speaker: 'NOVA',
            text: 'Outstanding work! All four wings of LUNA-7 are stabilized. Head to the Master Console to establish comms with Maya!',
            priority: 'success',
          };
        }
        return null;
    }
  }

  public static getCompletionMessage(challenge: ChallengeId): NovaMessage {
    switch (challenge) {
      case 'power':
        return {
          id: 'comp-power',
          speaker: 'NOVA',
          text: 'Power is back online! The station lights are humming and batteries are recharging.',
          subtext: 'Next: Listen for the ventilation chime and follow the cyan trail to Life Support.',
          priority: 'success',
        };
      case 'lifesupport':
        return {
          id: 'comp-life',
          speaker: 'NOVA',
          text: 'Airflow restored! The scrubbers are active and clean air is circulating to Maya.',
          subtext: 'Next: Follow the green trail to the Greenhouse to secure our water and food crops.',
          priority: 'success',
        };
      case 'greenhouse':
        return {
          id: 'comp-green',
          speaker: 'NOVA',
          text: 'Irrigation loop restored! The crops are thriving under full-spectrum PAR illumination.',
          subtext: 'Next: Follow the coral trail South to the Radiation Shelter before the solar storm hits.',
          priority: 'success',
        };
      case 'radiation':
        return {
          id: 'comp-rad',
          speaker: 'NOVA',
          text: 'Hydraulic storm shutter deployed and shielding locked! Radiation levels are safe.',
          subtext: 'Final Step: Return to the Central Hub to contact Maya and lock in the habitat configuration.',
          priority: 'success',
        };
      case 'master_console':
      default:
        return {
          id: 'comp-master',
          speaker: 'DR. MAYA CHEN',
          text: 'LUNA-7... I see all systems green on my monitor. You did it! Station is holding firm.',
          subtext: 'Signal established. Transmission received. The habitat is secure.',
          priority: 'success',
        };
    }
  }
}

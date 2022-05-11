import { components } from "@playt/client";
import {
  getMatch,
  getReplay,
  joinMatch,
  playerToken,
  Replay,
} from "../playt.js";
import PlayingScene from "./playing.js";

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super("loading");
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
  }

  async create() {
    this.add.image(400, 300, "sky");

    const statusText = this.add.text(100, 100, "Loading", {
      fontSize: "28px",
      fontFamily: "Courier",
      color: "white",
    });

    try {
      if (!playerToken) {
        statusText.setText([`Player Token: ✖`, `Participants: ?`]);
        return;
      }
      const match = await getMatch();

      statusText.setText([
        `Player Token: ✔`,
        `Match ID: ${match.id}`,
        `Match State: ${match.matchState}`,
        `Participants: ${match.participants.length}`,
        `Available Replays: ${match.availableReplays.length}`,
      ]);

      const selectedReplays: {
        [userId: string]: Replay;
      } = {};
      match.availableReplays.forEach((availableReplay, index) => {
        const replayText = this.add.text(
          100 + index * 20,
          350,
          index.toString(),
          {
            fontSize: "16px",
            fontStyle: "bold",
            color: "#999",
            backgroundColor: "#0e1217",
            padding: {
              x: 4,
              y: 4,
            },
          }
        );
        replayText.setInteractive();
        replayText.on("pointerdown", async () => {
          if (selectedReplays[availableReplay.userId]) {
            replayText.setColor("#999");
            delete selectedReplays[availableReplay.userId];
          } else {
            replayText.setColor("#fff");
            selectedReplays[availableReplay.userId] = await getReplay(
              availableReplay.matchId,
              availableReplay.userId
            );
          }
        });
      });

      if (match.matchState !== "finished") {
        const joinText = this.add.text(600, 550, "Join match", {
          fontSize: "26px",
          fontStyle: "bold",
          color: "white",
          backgroundColor: "#0e1217",
          padding: {
            x: 4,
            y: 4,
          },
        });
        joinText.setInteractive();
        joinText.on("pointerdown", async () => {
          try {
            await joinMatch();
          } catch (error) {
            // Could fail, if already joined
          }
          const playingScene = this.scene.get("playing") as PlayingScene;
          playingScene.data.set(
            "replays",
            JSON.stringify(Object.values(selectedReplays))
          );
          playingScene.scene.start();
        });
      }
    } catch (error: any) {
      statusText.setText([
        "You destroyed the internet!",
        error.message || "Unknown error",
      ]);
    }
  }
}
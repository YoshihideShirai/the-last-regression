import Phaser from "phaser";

type EvidenceKey = "log" | "pr" | "spec" | "test";

type Choice = {
  label: string;
  effect: (scene: MysteryScene) => void;
};

type Chapter = {
  text: string;
  choices: Choice[];
};

const evidenceBook: Record<EvidenceKey, string> = {
  log: "エラーログ: 02:13 に payment.total が undefined",
  pr: "PR #128: 金額計算の共通化。author は Ren",
  spec: "仕様書: 小数点は切り上げ（roundUp）必須",
  test: "テスト結果: checkout のみ fail。inventory は pass"
};

class MysteryScene extends Phaser.Scene {
  private chapter = 1;
  private trust = 50;
  private evidence = new Set<EvidenceKey>();

  private readonly ui = {
    chapterText: null as Phaser.GameObjects.Text | null,
    trustText: null as Phaser.GameObjects.Text | null,
    storyText: null as Phaser.GameObjects.Text | null,
    feedbackText: null as Phaser.GameObjects.Text | null,
    evidenceText: null as Phaser.GameObjects.Text | null,
    resultText: null as Phaser.GameObjects.Text | null,
    choiceButtons: [] as Array<{ box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }>,
    suspectButtons: [] as Array<{ box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }>,
    restartButton: null as { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } | null
  };

  private readonly chapters: Chapter[] = [
    {
      text: "朝、リリース直前の本番相当環境で checkout がクラッシュ。\n『昨夜マージしたのは3件だけだ』\nPMのミウが震える声で言う。",
      choices: [
        {
          label: "CIログを精査する",
          effect: (scene) => {
            scene.addEvidence("log");
            scene.trust += 10;
            scene.nextChapter("ログには payment.total undefined。発生時刻は02:13。");
          }
        },
        {
          label: "とりあえず全員を疑う",
          effect: (scene) => {
            scene.trust -= 10;
            scene.nextChapter("空気が最悪になった。情報は増えない。");
          }
        }
      ]
    },
    {
      text: "開発者3人の証言:\n- Aoi『私は在庫APIしか触ってない』\n- Ren『金額計算をutilに寄せた』\n- Kuro『デザインだけ調整した』",
      choices: [
        {
          label: "PRとdiffを確認",
          effect: (scene) => {
            scene.addEvidence("pr");
            scene.addEvidence("test");
            scene.trust += 10;
            scene.nextChapter("checkout だけ失敗。金額計算の変更が怪しい。");
          }
        },
        {
          label: "勘でKuroを追及",
          effect: (scene) => {
            scene.trust -= 8;
            scene.nextChapter("CSS変更しかなく、時間を浪費した。");
          }
        }
      ]
    },
    {
      text: "最後の手掛かり。仕様書には『税計算後は roundUp』。\nしかし実装は Math.round に見える……。",
      choices: [
        {
          label: "仕様書を確認して証拠化",
          effect: (scene) => {
            scene.addEvidence("spec");
            scene.trust += 15;
            scene.startTrial();
          }
        },
        {
          label: "勢いでhotfixを入れる",
          effect: (scene) => {
            scene.trust -= 15;
            scene.startTrial();
          }
        }
      ]
    }
  ];

  constructor() {
    super("mystery");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#14081f");

    this.add.rectangle(640, 360, 1240, 680, 0x211134, 0.95).setStrokeStyle(2, 0x5c2f84);

    this.add.text(40, 24, "デバッグ裁判：最後のリグレッション", {
      fontFamily: "Noto Sans JP, Yu Gothic, sans-serif",
      color: "#f7ebff",
      fontSize: "32px",
      fontStyle: "bold"
    });

    this.add.text(40, 66, "CIが突然赤くなった。証拠を集め、真犯人のバグを暴け。", {
      fontFamily: "Noto Sans JP, Yu Gothic, sans-serif",
      color: "#bba9ca",
      fontSize: "18px"
    });

    this.ui.chapterText = this.add.text(40, 110, "チャプター: 1/3", { color: "#f7ebff", fontSize: "20px" });
    this.ui.trustText = this.add.text(290, 110, "信頼度: 50", { color: "#f7ebff", fontSize: "20px" });

    this.ui.storyText = this.add.text(40, 150, "", {
      fontFamily: "Noto Sans JP, Yu Gothic, sans-serif",
      color: "#f7ebff",
      fontSize: "22px",
      wordWrap: { width: 1180 },
      lineSpacing: 8
    });

    this.ui.feedbackText = this.add.text(40, 308, "", {
      color: "#ffd166",
      fontSize: "18px",
      wordWrap: { width: 1180 }
    });

    this.add.text(40, 360, "行動を選択", { color: "#f7ebff", fontSize: "24px", fontStyle: "bold" });

    this.ui.evidenceText = this.add.text(40, 570, "コトダマ: なし", {
      color: "#bba9ca",
      fontSize: "18px",
      wordWrap: { width: 1180 }
    });

    this.ui.resultText = this.add.text(40, 618, "", {
      color: "#f7ebff",
      fontSize: "20px",
      wordWrap: { width: 1180 }
    });

    this.renderChapter();
  }

  private makeButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void
  ): { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
    const box = this.add.rectangle(x, y, width, height, 0x27123d).setOrigin(0, 0).setStrokeStyle(2, 0x6a3d90);
    const txt = this.add
      .text(x + 16, y + 12, label, {
        fontFamily: "Noto Sans JP, Yu Gothic, sans-serif",
        color: "#f7ebff",
        fontSize: "18px",
        wordWrap: { width: width - 32 }
      })
      .setInteractive({ useHandCursor: true });

    const activate = () => onClick();

    box.setInteractive({ useHandCursor: true }).on("pointerdown", activate);
    txt.on("pointerdown", activate);

    const onHover = () => box.setStrokeStyle(2, 0xff2d75);
    const offHover = () => box.setStrokeStyle(2, 0x6a3d90);

    box.on("pointerover", onHover).on("pointerout", offHover);
    txt.on("pointerover", onHover).on("pointerout", offHover);

    return { box, label: txt };
  }

  private clearButtons(kind: "choiceButtons" | "suspectButtons"): void {
    this.ui[kind].forEach((b) => {
      b.box.destroy();
      b.label.destroy();
    });
    this.ui[kind] = [];
  }

  private renderChapter(): void {
    const chapter = this.chapters[this.chapter - 1];
    if (!chapter || !this.ui.chapterText || !this.ui.trustText || !this.ui.storyText || !this.ui.feedbackText) {
      return;
    }

    this.clearButtons("choiceButtons");
    this.clearButtons("suspectButtons");
    this.ui.resultText?.setText("");
    if (this.ui.restartButton) {
      this.ui.restartButton.box.destroy();
      this.ui.restartButton.label.destroy();
      this.ui.restartButton = null;
    }

    this.ui.chapterText.setText(`チャプター: ${this.chapter}/3`);
    this.ui.trustText.setText(`信頼度: ${this.trust}`);
    this.ui.storyText.setText(chapter.text);
    this.ui.feedbackText.setText("");

    chapter.choices.forEach((choice, index) => {
      const button = this.makeButton(40, 406 + index * 74, 1180, 60, choice.label, () => choice.effect(this));
      this.ui.choiceButtons.push(button);
    });

    this.renderEvidence();
  }

  private addEvidence(key: EvidenceKey): void {
    this.evidence.add(key);
    this.renderEvidence();
  }

  private renderEvidence(): void {
    if (!this.ui.evidenceText) {
      return;
    }
    if (this.evidence.size === 0) {
      this.ui.evidenceText.setText("コトダマ: なし");
      return;
    }
    const labels = [...this.evidence].map((key) => `・${evidenceBook[key]}`);
    this.ui.evidenceText.setText(`コトダマ:\n${labels.join("\n")}`);
  }

  private disableChoiceButtons(): void {
    this.ui.choiceButtons.forEach((b) => {
      b.box.disableInteractive();
      b.label.disableInteractive();
      b.box.setFillStyle(0x27123d, 0.45);
    });
  }

  private nextChapter(message: string): void {
    if (!this.ui.feedbackText || !this.ui.trustText) {
      return;
    }
    this.ui.feedbackText.setText(`▶ ${message}`);
    this.disableChoiceButtons();
    this.ui.trustText.setText(`信頼度: ${this.trust}`);

    this.time.delayedCall(700, () => {
      this.chapter += 1;
      this.renderChapter();
    });
  }

  private startTrial(): void {
    if (!this.ui.chapterText || !this.ui.storyText || !this.ui.feedbackText || !this.ui.trustText) {
      return;
    }

    this.disableChoiceButtons();
    this.clearButtons("choiceButtons");

    this.ui.chapterText.setText("チャプター: 裁判");
    this.ui.trustText.setText(`信頼度: ${this.trust}`);
    this.ui.storyText.setText(
      "ノンストップ・デバッグ議論\n矛盾する発言を撃ち抜け。checkout だけ壊れた原因は誰のどの変更か？"
    );
    this.ui.feedbackText.setText("犯人候補を選べ。");

    const suspects = [
      {
        label: "Aoi: 在庫APIのレスポンス遅延が原因",
        ok: false,
        reason: "inventory はテスト pass。症状と一致しない。"
      },
      {
        label: "Kuro: CSS変更で入力欄が壊れた",
        ok: false,
        reason: "UIの問題ではなく、サーバーで undefined が発生。"
      },
      {
        label: "Ren: 共通化PRで roundUp を round に置換し total を返し忘れ",
        ok: true,
        reason: "仕様違反とログ時刻、checkout 単独 fail の全てと一致。"
      }
    ];

    suspects.forEach((suspect, index) => {
      const button = this.makeButton(40, 406 + index * 74, 1180, 60, suspect.label, () => this.judge(suspect.ok, suspect.reason));
      this.ui.suspectButtons.push(button);
    });
  }

  private judge(ok: boolean, reason: string): void {
    if (!this.ui.resultText) {
      return;
    }

    this.ui.suspectButtons.forEach((b) => {
      b.box.disableInteractive();
      b.label.disableInteractive();
    });

    const hasCriticalEvidence = this.evidence.has("log") && this.evidence.has("pr") && this.evidence.has("spec");
    if (ok && hasCriticalEvidence) {
      this.ui.resultText.setColor("#40d99b");
      this.ui.resultText.setText(`論破成功！\n${reason}\n信頼度 ${this.trust} で真相に到達した。`);
    } else if (ok) {
      this.ui.resultText.setColor("#ffd166");
      this.ui.resultText.setText("犯人は当てたが証拠不足。再現テストは通らず、チームは半信半疑だ。");
    } else {
      this.ui.resultText.setColor("#ff7f7f");
      this.ui.resultText.setText(`反論失敗… ${reason}`);
    }

    this.renderRestart();
  }

  private renderRestart(): void {
    if (this.ui.restartButton) {
      return;
    }
    this.ui.restartButton = this.makeButton(40, 528, 360, 52, "最初からやり直す", () => this.resetGame());
  }

  private resetGame(): void {
    this.chapter = 1;
    this.trust = 50;
    this.evidence.clear();
    this.renderChapter();
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: 1280,
  height: 720,
  backgroundColor: "#14081f",
  scene: [MysteryScene]
};

new Phaser.Game(config);

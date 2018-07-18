import {
  Scene,
  StandardMaterial,
  Mesh,
  Vector4,
  Color3,
  Material,
  Texture,
  MeshBuilder,
  Matrix,
  Vector3,
  Animation,
  AnimationGroup,
  Quaternion,
  ActionManager
} from "babylonjs";
import { normalizeAxisValue, easingFunction, countDownCB } from "./helpers";
const pivotAt = new BABYLON.Vector3(0, 0, 0);
import { CubeSidesEnum, AxisEnum } from "./enums";
import { environment } from "~/environments/environment";

declare const require:any;
const Cubejs = require("cubejs/lib/cube");
require("cubejs/lib/solve");

Cubejs.initSolver();
const sideUVDict = {
  [CubeSidesEnum.FRONT]: new Vector4(0, 6 / 7, 1, 1),
  [CubeSidesEnum.BACK]: new Vector4(0, 5 / 7, 1, 6 / 7),
  [CubeSidesEnum.LEFT]: new Vector4(0, 4 / 7, 1, 5 / 7),
  [CubeSidesEnum.RIGHT]: new Vector4(0, 3 / 7, 1, 4 / 7),
  [CubeSidesEnum.UP]: new Vector4(0, 2 / 7, 1, 3 / 7),
  [CubeSidesEnum.DOWN]: new Vector4(0, 1 / 7, 1, 2 / 7),
  [CubeSidesEnum.INNER]: new Vector4(0, 0, 1, 1 / 7)
};

function moveToLetter([axis, position, isClockwise]: [
  AxisEnum,
  number,
  boolean,
  number | undefined
]): string {
  let letter: string;
  if (position === 0) {
    switch (axis) {
      case AxisEnum.X:
        letter = "B";
        break;
      case AxisEnum.Y:
        letter = "D";
        break;
      case AxisEnum.Z:
        letter = "L";
        break;
    }
    if (isClockwise) {
      letter += "'";
    }
  } else if (position === 2) {
    switch (axis) {
      case AxisEnum.X:
        letter = "F";
        break;
      case AxisEnum.Y:
        letter = "U";
        break;
      case AxisEnum.Z:
        letter = "R";
        break;
    }
    if (!isClockwise) {
      letter += "'";
    }
  } else {
    switch (axis) {
      case AxisEnum.X:
        letter = "S";
        break;
      case AxisEnum.Y:
        letter = "E'";
        break;
      case AxisEnum.Z:
        letter = "M'";
        break;
    }
    if (!isClockwise) {
      letter = letter.includes("'") ? letter.slice(0, -1) : letter + "'";
    }
  }
  return letter;
}

function letterToMoves(letter: string) {
  let moves: [AxisEnum, number, boolean][] = [],
    axis: AxisEnum,
    position: number,
    isClockwise: boolean;
  if (letter.indexOf("F") === 0) {
    axis = AxisEnum.X;
    position = 2;
    isClockwise = true;
  } else if (letter.indexOf("B") === 0) {
    axis = AxisEnum.X;
    position = 0;
    isClockwise = false;
  } else if (letter.indexOf("U") === 0) {
    axis = AxisEnum.Y;
    position = 2;
    isClockwise = true;
  } else if (letter.indexOf("D") === 0) {
    axis = AxisEnum.Y;
    position = 0;
    isClockwise = false;
  } else if (letter.indexOf("R") === 0) {
    axis = AxisEnum.Z;
    position = 2;
    isClockwise = true;
  } else if (letter.indexOf("L") === 0) {
    axis = AxisEnum.Z;
    position = 0;
    isClockwise = false;
  }
  if (letter[1] === "'") {
    moves.push([axis, position, !isClockwise]);
  } else if (letter[1] === "2") {
    moves = [[axis, position, isClockwise], [axis, position, isClockwise]];
  } else {
    moves.push([axis, position, isClockwise]);
  }
  return moves;
}

function calcFaceUV(x: number, y: number, z: number, orderNum: number) {
  let faceUV: Vector4[] = new Array(6);
  faceUV.fill(sideUVDict[CubeSidesEnum.INNER]);
  if (z === orderNum - 1) {
    //front
    faceUV[0] = sideUVDict[CubeSidesEnum.FRONT];
  } else if (z === 0) {
    //back
    faceUV[1] = sideUVDict[CubeSidesEnum.BACK];
  }

  if (x === orderNum - 1) {
    //left
    faceUV[2] = sideUVDict[CubeSidesEnum.LEFT];
  } else if (x === 0) {
    //right
    faceUV[3] = sideUVDict[CubeSidesEnum.RIGHT];
  }
  if (y === orderNum - 1) {
    //up
    faceUV[4] = sideUVDict[CubeSidesEnum.UP];
  } else if (y === 0) {
    //down
    faceUV[5] = sideUVDict[CubeSidesEnum.DOWN];
  }
  return faceUV;
}

function createMats(scene: Scene) {
  let material = new StandardMaterial("cubeSprite", scene);
  material.diffuseTexture = new Texture(
    `${environment.deployUrl}/assets/cubeSprite.png`,
    scene
  );
  return material;
}

function rotatePieceAnimation(
  pivoteAxis: AxisEnum,
  initRotationValue: number,
  rotateValue: number,
  speed: number
) {
  let animation = new Animation(
    "rotateAnimation",
    "rotation." + pivoteAxis,
    60,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  let keys = [];
  keys.push({
    frame: 0,
    value: initRotationValue
  });
  keys.push({
    frame: speed,
    value: rotateValue
  });
  animation.setKeys(keys);
  animation.setEasingFunction(easingFunction);
  return animation;
}

export default class Cube {
  private scene: Scene;
  private pieces: Mesh[][][];
  private orderNum: number;
  private speed = 30;
  private isRotating = false;
  private rotatingStartCB: (() => any) | undefined | null;
  private rotatingStopCB: (() => any) | undefined | null;
  private moves: [AxisEnum, number, boolean, number | undefined][] = [];
  private actionManager: ActionManager;
  private preRotateInfo: {
    pieces: Mesh[];
    rotateParams: [AxisEnum, number];
  } | null;
  private cubejs: any = new Cubejs();

  constructor(
    scene: Scene,
    orderNum: number,
    options: {
      rotatingStartCB?: (() => any) | undefined | null;
      rotatingStopCB?: (() => any) | undefined | null;
      pickStartCB?: ((e: any) => any) | undefined | null;
      pickStopCB?: ((e: any) => any) | undefined | null;
    } = {}
  ) {
    this.scene = scene;
    this.orderNum = orderNum;
    this.rotatingStartCB = options.rotatingStartCB;
    this.rotatingStopCB = options.rotatingStopCB;
    this.pieces = this.createPieces();
  }

  private destroyPieces() {
    for (let x = 0; x < this.orderNum; x++) {
      let planePieces: Mesh[][] = this.pieces[x];
      for (let y = 0; y < this.orderNum; y++) {
        let rowPieces: Mesh[] = planePieces[y];
        for (let z = 0; z < this.orderNum; z++) {
          rowPieces[z].dispose();
        }
      }
    }
  }

  private createPieces(): Mesh[][][] {
    let mat = createMats(this.scene);
    let pieces: Mesh[][][] = [];
    for (let x = 0; x < this.orderNum; x++) {
      let planePieces: Mesh[][] = [];
      for (let y = 0; y < this.orderNum; y++) {
        let rowPieces: Mesh[] = [];
        for (let z = 0; z < this.orderNum; z++) {
          let mesh = MeshBuilder.CreateBox(
            `Piece-${x}-${y}-${z}`,
            {
              width: 1,
              height: 1,
              depth: 1,
              faceUV: calcFaceUV(x, y, z, this.orderNum)
            },
            this.scene
          );
          let offset = 0.5 - this.orderNum / 2;
          let [axisX, axisY, axisZ] = [x, y, z].map(
            axisValue => axisValue + offset
          );
          mesh.position.x = axisX;
          mesh.position.y = axisY;
          mesh.position.z = axisZ;
          let { x: tx, y: ty, z: tz } = mesh.position.subtract(pivotAt);
          mesh.setPivotMatrix(Matrix.Translation(tx, ty, tz));
          mesh.material = mat;
          let edgeNum = this.orderNum - 1;
          if (
            x !== edgeNum &&
            y !== edgeNum &&
            z !== edgeNum &&
            x !== 0 &&
            y !== 0 &&
            z !== 0
          ) {
            // mesh.isPickable = false;
          }
          rowPieces.push(mesh);
        }
        planePieces.push(rowPieces);
      }
      pieces.push(planePieces);
    }
    return pieces;
  }

  public setSpeed(value: number) {
    this.speed = value;
  }

  public rotatePieces(
    axis: AxisEnum,
    position: number,
    isClockwise: boolean,
    speed?: number
  ) {
    this.moves.push([axis, position, isClockwise, speed]);
    if (!this.isRotating) {
      this.isRotating = true;
      this.rotatingStartCB && this.rotatingStartCB();
      this.startRotating();
    }
  }

  private getPieces(axis: AxisEnum, position: number) {
    let pieces: Mesh[] = [];
    if (axis === AxisEnum.X) {
      this.pieces[position].forEach(rowPieces => {
        rowPieces.forEach(piece => {
          pieces.push(piece);
        });
      });
    } else if (axis === AxisEnum.Y) {
      this.pieces.forEach((planePieces, x) => {
        planePieces[position].forEach((piece, z) => {
          pieces.push(piece);
        });
      });
    } else {
      this.pieces.forEach(planePieces => {
        planePieces.forEach(rowPieces => {
          pieces.push(rowPieces[position]);
        });
      });
    }
    return pieces;
  }

  private startRotating = () => {
    let move = this.moves.shift();
    if (move == null) {
      this.isRotating = false;
      this.rotatingStopCB && this.rotatingStopCB();
      return;
    }
    let [axis, position, isClockwise, speed] = move;
    let animationGroup = new AnimationGroup("rotate-pieces-" + axis + position);
    let pieces = this.getPieces(axis, position);
    pieces.forEach(piece => {
      let animation = rotatePieceAnimation(
        axis,
        piece.rotation[axis],
        isClockwise ? Math.PI / 2 : -Math.PI / 2,
        speed != null ? speed : this.speed
      );
      animationGroup.addTargetedAnimation(animation, piece);
    });
    let countDown = Math.pow(this.orderNum, 2);
    animationGroup.onAnimationEndObservable.add(
      countDownCB(countDown, () => {
        this.bakePieces(axis, position, pieces);
      })
    );
    animationGroup.onAnimationEndObservable.add(
      countDownCB(countDown, this.startRotating)
    );
    animationGroup.play();
    this.cubejs.move(moveToLetter(move));
  };

  public preRotate(axis: AxisEnum, position: number, rotateValue: number) {
    if (this.preRotateInfo) {
      let { rotateParams } = this.preRotateInfo;
      if (axis !== rotateParams[0] || position !== rotateParams[1]) {
        this.clearPreRotate();
        this.preRotateInfo = {
          pieces: this.getPieces(axis, position),
          rotateParams: [axis, position]
        };
      }
    } else {
      this.preRotateInfo = {
        pieces: this.getPieces(axis, position),
        rotateParams: [axis, position]
      };
    }
    let { pieces } = this.preRotateInfo;
    pieces.forEach(piece => {
      piece.rotation[axis] = rotateValue;
    });
  }

  public clearPreRotate() {
    if (this.preRotateInfo) {
      this.preRotateInfo.pieces.forEach(mesh => {
        mesh.rotation = BABYLON.Vector3.Zero();
      });
      this.preRotateInfo = null;
    }
  }

  private bakePieces(axis: AxisEnum, position: number, pieces: Mesh[]) {
    let offset = this.orderNum / 2 - 0.5;
    pieces.forEach((piece, index) => {
      if (Math.floor(piece.rotation[axis] / (Math.PI / 2)) === 0) {
        piece.rotation[axis] = 0;
      }
      let newPosition = piece.getAbsolutePosition();
      let x = normalizeAxisValue(newPosition.x),
        y = normalizeAxisValue(newPosition.y),
        z = normalizeAxisValue(newPosition.z);
      let [xIndex, yIndex, zIndex] = [x + offset, y + offset, z + offset];
      this.pieces[xIndex][yIndex][zIndex] = piece;
      piece.bakeTransformIntoVertices(
        piece.computeWorldMatrix(true).setTranslation(new Vector3(0, 0, 0))
      );
      piece.position.copyFromFloats(x, y, z);
      piece.rotation.copyFromFloats(0, 0, 0);
      let { x: tx, y: ty, z: tz } = piece.position.subtract(pivotAt);
      piece.setPivotMatrix(Matrix.Translation(tx, ty, tz));
    });
  }

  public getAnswer(): string {
    return this.cubejs.solve();
  }

  public rotateByLetters(letters: string) {
    letters.split(" ").forEach((letter: string) => {
      letterToMoves(letter).forEach(move =>
        this.rotatePieces(move[0], move[1], move[2], 10)
      );
    });
  }

  public isSolved(): boolean {
    return this.cubejs.isSolved();
  }

  public reset() {
    this.destroyPieces();
    this.pieces = this.createPieces();
    this.cubejs = new Cubejs();
  }

  public scramble() {
    Cubejs.scramble()
      .split(" ")
      .forEach((letter: string) => {
        letterToMoves(letter).forEach(move =>
          this.rotatePieces(move[0], move[1], move[2], 10)
        );
      });
  }
}

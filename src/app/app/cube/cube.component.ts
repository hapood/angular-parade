import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef
} from "@angular/core";
import { MatDialog } from "@angular/material";
import { CubeInfoDialog } from "./cube-info-dialog.component";
import {
  Animation,
  Engine,
  Scene,
  ArcRotateCamera,
  Mesh,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  Plane,
  StandardMaterial,
  Space,
  AnimationGroup,
  Color3
} from "babylonjs";
import Cube from "./lib/Cube";
import { easingFunction } from "./lib/helpers";
import { CubeSidesEnum, AxisEnum } from "./lib/enums";
import showAxes from "./lib/showAxes";
import {
  getPoints,
  getPoissonsEquation,
  getTranslateVector,
  directionToRotatePieces
} from "./lib/helpers";
const ORDER_NUMBER = 3;
const CAMERA_DISTANCE = 5;
export const DIRECTION_PLANE_WIDTH = 50;

const alphaOffset = Math.PI / 4;
const cameraAlphas = [
  alphaOffset,
  Math.PI / 2 + alphaOffset,
  Math.PI + alphaOffset,
  (Math.PI * 3) / 2 + alphaOffset
];
const cameraBetas = [Math.PI / 3, (Math.PI * 2) / 3];

function translateCameraPosition([alphaIndex, betaIndex]: [number, number]): [
  number,
  number
] {
  return [cameraAlphas[alphaIndex], cameraBetas[betaIndex]];
}

function rotateCameraAnimationGroup(
  [alpha, beta]: [number, number],
  speed: number,
  camera: ArcRotateCamera,
  isClockwise: boolean
) {
  let animationAlpha = new Animation(
    "rotateCameraAlpha",
    "alpha",
    60,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  let oldAlpha = camera.alpha;
  if (isClockwise && oldAlpha > alpha) {
    oldAlpha -= Math.PI * 2;
  } else if (!isClockwise && oldAlpha < alpha) {
    oldAlpha += Math.PI * 2;
  }
  animationAlpha.setKeys([
    {
      frame: 0,
      value: oldAlpha
    },
    {
      frame: speed,
      value: alpha
    }
  ]);
  let animationBeta = new Animation(
    "rotateCameraBeta",
    "beta",
    60,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  let oldBeta = camera.beta;
  animationBeta.setKeys([
    {
      frame: 0,
      value: oldBeta
    },
    {
      frame: speed,
      value: beta
    }
  ]);
  animationAlpha.setEasingFunction(easingFunction);
  animationBeta.setEasingFunction(easingFunction);
  let animationGroup = new AnimationGroup("rotateCamera");
  animationGroup.addTargetedAnimation(animationAlpha, camera);
  animationGroup.addTargetedAnimation(animationBeta, camera);
  return animationGroup;
}

@Component({
  selector: "app-cube",
  templateUrl: "./cube.component.html",
  styleUrls: ["./cube.component.scss"]
})
export class CubeComponent implements AfterViewInit {
  @ViewChild("canvas") private canvasRef: ElementRef;
  private engine: Engine;
  private scene: Scene;
  public cube: Cube;
  private camera: ArcRotateCamera;
  private directionPlane: Mesh;
  private preRotateParams: [AxisEnum, number, number] | null;
  private pickInfo: {
    pickStartTime: number;
  } | null;
  public isFreeze: boolean = false;
  private cameraAnimationGroup: AnimationGroup;
  public cameraPosition: [number, number] = [0, 0];

  constructor(private dialog: MatDialog, private cd: ChangeDetectorRef) {}

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private initEngine() {
    this.canvas.oncontextmenu = function() {
      return false;
    };
    this.engine = new Engine(this.canvas, true, { stencil: true });
  }

  private initScene() {
    this.scene = new Scene(this.engine);
    // showAxes(3, this.scene);
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);
  }

  private initCamera() {
    let camera = new ArcRotateCamera(
      "Camera",
      cameraAlphas[0],
      cameraBetas[0],
      8,
      BABYLON.Vector3.Zero(),
      this.scene
    );
    camera.attachControl(this.canvas);
    camera.inputs.clear();
    this.camera = camera;
    this.camera.animations = [];
  }

  private initLight() {
    let light1 = new HemisphericLight(
      "light",
      new Vector3(-1, 0, 0),
      this.scene
    );
    let light2 = new HemisphericLight(
      "light",
      new Vector3(1, 0, 0),
      this.scene
    );
    let light3 = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      this.scene
    );
    let light4 = new HemisphericLight(
      "light",
      new Vector3(0, -1, 0),
      this.scene
    );
  }

  private initCube(orderNum: number) {
    this.cube = new Cube(this.scene, orderNum, {
      rotatingStopCB: () => {
        this.isFreeze = false;
        if (this.cube.isSolved()) {
          let dialogRef = this.dialog.open(CubeInfoDialog, {
            width: "250px",
            data: {
              title: "恭喜你成功解开魔方",
              content: "是否重新开始？",
              no: "关闭",
              yes: "重新开始"
            }
          });
          dialogRef.afterClosed().subscribe((isRestart: boolean) => {
            if (isRestart) {
              this.restart();
            }
          });
        }
      },
      rotatingStartCB: () => {
        this.isFreeze = true;
      }
    });
  }

  private pickStopCB = (event: MouseEvent) => {
    if (this.isFreeze) return;
    if (this.directionPlane) {
      this.directionPlane.dispose();
      this.directionPlane = null;
    }
    let preRotateParams = this.preRotateParams;
    if (preRotateParams) {
      if (
        this.pickInfo != null &&
        new Date().getTime() - this.pickInfo.pickStartTime > 100
      ) {
        this.cube.rotatePieces(
          preRotateParams[0],
          preRotateParams[1],
          preRotateParams[2] >= 0
        );
      }
    }
    this.preRotateParams = null;
    this.cube.clearPreRotate();
  };

  private startRendering() {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  public rotateCamera(value: number) {
    if (this.cameraAnimationGroup) {
      this.cameraAnimationGroup.stop();
    }
    this.cameraPosition[0] += value;
    if (this.cameraPosition[0] > 3) {
      this.cameraPosition[0] %= 4;
    } else if (this.cameraPosition[0] < 0) {
      this.cameraPosition[0] = (this.cameraPosition[0] % 3) + 4;
    }
    this.cameraAnimationGroup = rotateCameraAnimationGroup(
      translateCameraPosition(this.cameraPosition),
      30,
      this.camera,
      value > 0
    ).play();
  }

  public resetCamera() {
    if (this.cameraAnimationGroup) {
      this.cameraAnimationGroup.stop();
    }
    let animationGroup = rotateCameraAnimationGroup(
      translateCameraPosition([0, 0]),
      30,
      this.camera,
      true
    ).play();
    this.cameraAnimationGroup = animationGroup;
    this.cameraPosition = [0, 0];
  }

  public switchCamera() {
    if (this.cameraAnimationGroup) {
      this.cameraAnimationGroup.stop();
    }
    this.cameraPosition[1] = this.cameraPosition[1] === 0 ? 1 : 0;
    this.cameraAnimationGroup = rotateCameraAnimationGroup(
      translateCameraPosition(this.cameraPosition),
      30,
      this.camera,
      true
    ).play();
  }

  @HostListener("window:resize", ["$event"])
  private onResize(event?: Event) {
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerWidth + "px";
    this.engine.resize();
  }

  private pickingCb = (event: MouseEvent) => {
    if (this.isFreeze) return;
    let pickResult = this.scene.pick(event.layerX, event.layerY, mesh => {
      if (mesh == this.directionPlane && mesh.isPickable === true) {
        return true;
      }
      return false;
    });
    if (pickResult.hit) {
      let direction = pickResult.pickedPoint.add(
        pickResult.pickedMesh.getAbsolutePosition().negate()
      );
      let normal = pickResult.getNormal(true);
      let rotateParams = directionToRotatePieces(
        direction,
        normal,
        pickResult.pickedMesh.getAbsolutePosition(),
        ORDER_NUMBER
      );
      if (direction.length() > 1) {
        this.cube.preRotate(rotateParams[0], rotateParams[1], rotateParams[2]);
        this.preRotateParams = rotateParams;
      } else {
        this.preRotateParams = null;
        this.cube.clearPreRotate();
      }
    }
  };

  private pickStartCB = (event: MouseEvent) => {
    if (this.isFreeze) return;
    this.pickInfo = {
      pickStartTime: new Date().getTime()
    };
    if (this.directionPlane) {
      this.directionPlane = null;
      this.directionPlane.dispose();
    }
    let pickResult = this.scene.pick(event.layerX, event.layerY);
    if (!pickResult.hit) return;
    let indices = pickResult.pickedMesh.getIndices();
    let index0 = indices[pickResult.faceId * 3];
    let index1 = indices[pickResult.faceId * 3 + 1];
    let index2 = indices[pickResult.faceId * 3 + 2];
    let [p1, p2, p3] = getPoints(pickResult.pickedMesh, [
      index0,
      index1,
      index2
    ]);
    let [a, b, c, d] = getPoissonsEquation(p1, p2, p3);
    let sourcePlane = new Plane(a, b, c, 0);
    let plane = MeshBuilder.CreatePlane(
      "directionPlane",
      {
        height: DIRECTION_PLANE_WIDTH,
        width: DIRECTION_PLANE_WIDTH,
        sourcePlane: sourcePlane,
        sideOrientation: Mesh.DOUBLESIDE
      },
      this.scene
    );
    plane.isPickable = false;
    plane.isVisible = false;
    let mat = new StandardMaterial("mat", this.scene);
    mat.emissiveColor = Color3.White();
    mat.wireframe = true;
    plane.material = mat;
    let tv = getTranslateVector(p1, p2, p3);
    plane.translate(tv, 1, Space.WORLD);
    setTimeout(function() {
      plane.isPickable = true;
    }, 10);
    this.directionPlane = plane;
  };

  initController() {
    this.canvas.addEventListener("pointerdown", this.pickStartCB);
    this.canvas.addEventListener("pointerup", this.pickStopCB);
    this.canvas.addEventListener("pointermove", this.pickingCb);
  }

  start() {
    if (!this.cube.isSolved()) {
      let dialogRef = this.dialog.open(CubeInfoDialog, {
        width: "250px",
        data: {
          title: "重新开始",
          content: "重新开始游戏会丢失当前进度，是否确认",
          no: "继续游戏",
          yes: "重新开始"
        }
      });
      dialogRef.afterClosed().subscribe((isRestart: boolean) => {
        if (isRestart) {
          this.restart();
        }
      });
    } else {
      this.restart();
    }
  }

  restart() {
    if (!this.cube.isSolved()) {
      this.cube.reset();
    }
    this.cube.scramble();
  }

  autoSolve() {
    let dialogRef = this.dialog.open(CubeInfoDialog, {
      width: "250px",
      data: {
        title: "参考答案",
        content: this.cube.getAnswer(),
        no: "关闭",
        yes: "自动还原"
      }
    });
    dialogRef.afterClosed().subscribe((isRestart: boolean) => {
      if (isRestart) {
        this.cube.rotateByLetters(this.cube.getAnswer());
      }
    });
  }

  ngAfterViewInit() {
    if (Engine.isSupported()) {
      this.initEngine();
      this.initScene();
      this.initLight();
      this.initCamera();
      this.initController();
      this.onResize();
      this.initCube(ORDER_NUMBER);
      this.startRendering();
      this.cd.detectChanges();
    } else {
      window.alert("It seems you must try this page in a newer browser :)");
    }
  }
}

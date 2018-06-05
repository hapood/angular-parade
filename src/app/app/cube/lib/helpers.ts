import {
  Vector3,
  Mesh,
  AbstractMesh,
  float,
  EasingFunction,
  QuinticEase
} from "babylonjs";
import { CubeSidesEnum, AxisEnum } from "./enums";

export function getPoissonsEquation(p1: Vector3, p2: Vector3, p3: Vector3) {
  let a = (p2.y - p1.y) * (p3.z - p1.z) - (p2.z - p1.z) * (p3.y - p1.y);
  let b = (p2.z - p1.z) * (p3.x - p1.x) - (p2.x - p1.x) * (p3.z - p1.z);
  let c = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  let d = a * p1.x + b * p1.y + c * p1.z;
  return [a, b, c, d];
}

export function getNormal(p1: Vector3, p2: Vector3, p3: Vector3): Vector3 {
  let x = (p2.y - p1.y) * (p3.z - p1.z) - (p2.z - p1.z) * (p3.y - p1.y);

  let y = (p2.z - p1.z) * (p3.x - p1.x) - (p2.x - p1.x) * (p3.z - p1.z);

  let z = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);

  return new Vector3(x, y, z);
}

export function point2panel(
  pt: Vector3,
  a: number,
  b: number,
  c: number,
  d: number
): number {
  return (
    Math.abs(a * pt.x + b * pt.y + c * pt.z + d) /
    Math.sqrt(a * a + b * b + c * c)
  );
}

export function castPointtoPanel(
  pt: Vector3,
  a: number,
  b: number,
  c: number,
  d: number
): Vector3 {
  let t = a * pt.x + b * pt.y + c * pt.z + d / a * a + b * b + c * c;
  let x = pt.x - a * t;
  let y = pt.y - b * t;
  let z = pt.z - c * t;
  return new Vector3(x, y, z);
}

export function getPoints(
  mesh: AbstractMesh,
  pointIndexes: number[]
): Vector3[] {
  let absolutePosition = mesh.getAbsolutePosition();
  let vertexPoints = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  return pointIndexes.map(index =>
    new Vector3(
      vertexPoints[index * 3],
      vertexPoints[index * 3 + 1],
      vertexPoints[index * 3 + 2]
    ).add(absolutePosition)
  );
}

export function isOrthogonal(v1: Vector3, v2: Vector3): boolean {
  return isZeroVector(v1.multiply(v2));
}

export function getTranslateVector(
  p1: Vector3,
  p2: Vector3,
  p3: Vector3
): Vector3 {
  let v1 = p2.subtract(p1);
  let v2 = p3.subtract(p2);
  let v3 = p1.subtract(p3);
  if (isOrthogonal(v1, v2)) {
    return new Vector3((p1.x + p3.x) / 2, (p1.y + p3.y) / 2, (p1.z + p3.z) / 2);
  } else if (isOrthogonal(v2, v3)) {
    return new Vector3((p2.x + p1.x) / 2, (p2.y + p1.y) / 2, (p2.z + p1.z) / 2);
  } else {
    return new Vector3((p2.x + p3.x) / 2, (p2.y + p3.y) / 2, (p2.z + p3.z) / 2);
  }
}

const xVevtor = new Vector3(1, 0, 0),
  yVevtor = new Vector3(0, 1, 0),
  zVevtor = new Vector3(0, 0, 1);

function alignDirection(rawDirection: Vector3) {
  let [absX, absY, absZ] = [
    Math.abs(rawDirection.x),
    Math.abs(rawDirection.y),
    Math.abs(rawDirection.z)
  ];
  if (absX >= absY && absX >= absZ) {
    return rawDirection.x >= 0 ? xVevtor : xVevtor.negate();
  } else if (absY >= absZ) {
    return rawDirection.y >= 0 ? yVevtor : yVevtor.negate();
  } else {
    return rawDirection.z >= 0 ? zVevtor : zVevtor.negate();
  }
}

export function normalizeAxisValue(axisValue: number): number {
  return Math.round(axisValue * 2) / 2;
}

function conicRotateValue(axisValue: number, maxRotateValue: number) {
  let rotateValue =
    Math.abs(axisValue) >= 2
      ? maxRotateValue
      : Math.pow(axisValue / 2, 2) * maxRotateValue;
  if (axisValue > 0) {
    return rotateValue;
  } else {
    return -rotateValue;
  }
}

function isZeroVector(v: Vector3) {
  return (
    normalizeAxisValue(v.x) === 0 &&
    normalizeAxisValue(v.y) === 0 &&
    normalizeAxisValue(v.z) === 0
  );
}

export function directionToRotatePieces(
  rawDirection: Vector3,
  normal: Vector3,
  centerPosition: Vector3,
  orderNum: number
): [AxisEnum, number, number] {
  let direction = alignDirection(rawDirection);
  let axis: AxisEnum, rotateValue: number;
  let maxRotateValue = Math.PI / 8;
  let getRotateValue = (axisValue: number) =>
    conicRotateValue(axisValue, maxRotateValue);
  if (
    isZeroVector(normal.multiply(xVevtor)) &&
    isZeroVector(normal.multiply(yVevtor))
  ) {
    if (isZeroVector(direction.multiply(xVevtor))) {
      rotateValue = -getRotateValue(rawDirection.y);
      if (centerPosition.z < 0) rotateValue = -rotateValue;
      axis = AxisEnum.X;
    } else {
      rotateValue = getRotateValue(rawDirection.x);
      if (centerPosition.z < 0) rotateValue = -rotateValue;
      axis = AxisEnum.Y;
    }
  } else if (
    isZeroVector(normal.multiply(yVevtor)) &&
    isZeroVector(normal.multiply(zVevtor))
  ) {
    if (isZeroVector(direction.multiply(yVevtor))) {
      rotateValue = -getRotateValue(rawDirection.z);
      if (centerPosition.x < 0) rotateValue = -rotateValue;
      axis = AxisEnum.Y;
    } else {
      rotateValue = getRotateValue(rawDirection.y);
      if (centerPosition.x < 0) rotateValue = -rotateValue;
      axis = AxisEnum.Z;
    }
  } else {
    if (isZeroVector(direction.multiply(xVevtor))) {
      rotateValue = getRotateValue(rawDirection.z);
      if (centerPosition.y < 0) rotateValue = -rotateValue;
      axis = AxisEnum.X;
    } else {
      rotateValue = -getRotateValue(rawDirection.x);
      if (centerPosition.y < 0) rotateValue = -rotateValue;
      axis = AxisEnum.Z;
    }
  }
  let offset = orderNum / 2 - 0.5;
  return [axis, normalizeAxisValue(centerPosition[axis]) + offset, rotateValue];
}

export function countDownCB(countDown: number, cb: () => any) {
  return function() {
    countDown--;
    if (countDown < 1) {
      setTimeout(() => cb(), 0);
    }
  };
}

export const easingFunction = new QuinticEase();
easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
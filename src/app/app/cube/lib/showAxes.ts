import * as BABYLON from "babylonjs";

export default function showAxes(size: number, scene: BABYLON.Scene) {
  let makeTextPlane = function(text: string, color: string, size: number) {
    let dynamicTexture = new BABYLON.DynamicTexture(
      "DynamicTexture",
      50,
      scene,
      true
    );
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(
      text,
      5,
      40,
      "bold 36px Arial",
      color,
      "transparent",
      true
    );
    let plane = BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
    let mat = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
    mat.backFaceCulling = false;
    mat.specularColor = new BABYLON.Color3(0, 0, 0);
    mat.diffuseTexture = dynamicTexture;
    plane.material = mat;
    return plane;
  };

  let axisX = BABYLON.Mesh.CreateLines(
    "axisX",
    [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(size, 0, 0),
      new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
      new BABYLON.Vector3(size, 0, 0),
      new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ],
    scene
  );
  axisX.color = new BABYLON.Color3(1, 0, 0);
  let xChar = makeTextPlane("X", "red", size / 10);
  xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
  let axisY = BABYLON.Mesh.CreateLines(
    "axisY",
    [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
      new BABYLON.Vector3(0, size, 0),
      new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ],
    scene
  );
  axisY.color = new BABYLON.Color3(0, 1, 0);
  let yChar = makeTextPlane("Y", "green", size / 10);
  yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
  let axisZ = BABYLON.Mesh.CreateLines(
    "axisZ",
    [
      BABYLON.Vector3.Zero(),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
      new BABYLON.Vector3(0, 0, size),
      new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ],
    scene
  );
  axisZ.color = new BABYLON.Color3(0, 0, 1);
  let zChar = makeTextPlane("Z", "blue", size / 10);
  zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
  axisX.isPickable = false;
  axisY.isPickable = false;
  axisZ.isPickable = false;
}
